/**
 * Block Store — Manages app blocklist state, native listing, and permissions
 */
import { create } from 'zustand';
import { EventEmitter } from 'expo-modules-core';
import * as db from '../services/database';
import ExpoAppBlocker from '../../modules/expo-app-blocker/src/ExpoAppBlockerModule';

export interface BlockedAppItem {
  id: number;
  packageName: string;
  displayName: string;
  iconUri: string | null;
  isActive: boolean;
}

export interface InstalledAppItem {
  packageName: string;
  displayName: string;
  icon: string;
}

interface BlockState {
  blockedApps: BlockedAppItem[];
  installedApps: InstalledAppItem[];
  isBlockingActive: boolean;
  isLoading: boolean;
  hasPermission: boolean;
  hasOverlayPermission: boolean;
  showOverlay: boolean;
  overlayAppName: string | null;
  overlayPackageName: string | null;

  // Actions
  loadBlockedApps: () => Promise<void>;
  loadInstalledApps: () => Promise<void>;
  checkPermission: () => void;
  requestPermission: () => void;
  requestOverlayPermission: () => void;
  addApp: (packageName: string, displayName: string, iconUri?: string) => Promise<void>;
  toggleApp: (packageName: string) => Promise<void>;
  removeApp: (packageName: string) => Promise<void>;
  setBlockingActive: (active: boolean) => void;
  triggerBlockOverlay: (appName: string, packageName: string) => void;
  dismissBlockOverlay: () => void;
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blockedApps: [],
  installedApps: [],
  isBlockingActive: false,
  isLoading: false,
  hasPermission: true,
  hasOverlayPermission: true,
  showOverlay: false,
  overlayAppName: null,
  overlayPackageName: null,

  loadBlockedApps: async () => {
    set({ isLoading: true });
    const apps = await db.getAllBlockedApps();
    set({
      blockedApps: apps.map((a) => ({
        id: a.id,
        packageName: a.package_name,
        displayName: a.display_name,
        iconUri: a.icon_uri,
        isActive: a.is_active === 1,
      })),
      isLoading: false,
    });
  },

  loadInstalledApps: async () => {
    try {
      const apps = ExpoAppBlocker.getInstalledApps();
      set({ installedApps: apps });
    } catch (e) {
      console.warn('Failed to load installed apps natively:', e);
    }
  },

  checkPermission: () => {
    try {
      const hasAccess = ExpoAppBlocker.hasUsageAccessPermission();
      const hasOverlay = ExpoAppBlocker.hasSystemAlertWindowPermission();
      set({ hasPermission: hasAccess, hasOverlayPermission: hasOverlay });
    } catch (e) {
      console.warn('Failed to check permission natively:', e);
    }
  },

  requestPermission: () => {
    try {
      ExpoAppBlocker.requestUsageAccessPermission();
    } catch (e) {
      console.warn('Failed to request permission natively:', e);
    }
  },

  requestOverlayPermission: () => {
    try {
      ExpoAppBlocker.requestSystemAlertWindowPermission();
    } catch (e) {
      console.warn('Failed to request overlay permission natively:', e);
    }
  },

  addApp: async (packageName, displayName, iconUri) => {
    await db.addBlockedApp(packageName, displayName, iconUri);
    await get().loadBlockedApps();
  },

  toggleApp: async (packageName) => {
    const { blockedApps } = get();
    const app = blockedApps.find((a) => a.packageName === packageName);
    if (app) {
      await db.toggleBlockedApp(packageName, !app.isActive);
      await get().loadBlockedApps();
    }
  },

  removeApp: async (packageName) => {
    await db.removeBlockedApp(packageName);
    await get().loadBlockedApps();
  },

  setBlockingActive: (active) => set({ isBlockingActive: active }),

  triggerBlockOverlay: (appName, packageName) => set({ showOverlay: true, overlayAppName: appName, overlayPackageName: packageName }),
  dismissBlockOverlay: () => set({ showOverlay: false, overlayAppName: null, overlayPackageName: null }),
}));

// Set up native event listener for blocker triggers
try {
  const blockerEmitter = new EventEmitter(ExpoAppBlocker as any) as any;
  blockerEmitter.addListener('onAppBlocked', (event: any) => {
    const { packageName } = event;
    const { blockedApps } = useBlockStore.getState();
    const matchedApp = blockedApps.find(a => a.packageName === packageName);
    const displayName = matchedApp?.displayName || 'Distracting App';
    useBlockStore.getState().triggerBlockOverlay(displayName, packageName);
  });
} catch (e) {
  // Safe catch if requireNativeModule is not resolved
}
