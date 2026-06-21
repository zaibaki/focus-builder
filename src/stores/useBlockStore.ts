/**
 * Block Store — Manages app blocklist state
 */
import { create } from 'zustand';
import * as db from '../services/database';

export interface BlockedAppItem {
  id: number;
  packageName: string;
  displayName: string;
  iconUri: string | null;
  isActive: boolean;
}

interface BlockState {
  blockedApps: BlockedAppItem[];
  isBlockingActive: boolean;
  isLoading: boolean;
  showOverlay: boolean;
  overlayAppName: string | null;

  // Actions
  loadBlockedApps: () => Promise<void>;
  addApp: (packageName: string, displayName: string, iconUri?: string) => Promise<void>;
  toggleApp: (packageName: string) => Promise<void>;
  removeApp: (packageName: string) => Promise<void>;
  setBlockingActive: (active: boolean) => void;
  triggerBlockOverlay: (appName: string) => void;
  dismissBlockOverlay: () => void;
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blockedApps: [],
  isBlockingActive: false,
  isLoading: false,
  showOverlay: false,
  overlayAppName: null,

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

  triggerBlockOverlay: (appName) => set({ showOverlay: true, overlayAppName: appName }),
  dismissBlockOverlay: () => set({ showOverlay: false, overlayAppName: null }),
}));
