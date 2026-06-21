import { requireNativeModule } from 'expo';

export interface ExpoAppBlockerModuleType {
  isSupported(): boolean;
  hasUsageAccessPermission(): boolean;
  requestUsageAccessPermission(): void;
  hasSystemAlertWindowPermission(): boolean;
  requestSystemAlertWindowPermission(): void;
  getInstalledApps(): Array<{ packageName: string; displayName: string; icon: string }>;
  startBlocking(packages: string[]): void;
  stopBlocking(): void;
}

let nativeModule: any = null;
try {
  nativeModule = requireNativeModule('ExpoAppBlocker');
} catch (e) {
  // Not compiled or running in Expo Go / Web / iOS
}

// Fallback Mock implementation
const mockModule: ExpoAppBlockerModuleType = {
  isSupported() {
    return false;
  },
  hasUsageAccessPermission() {
    return true;
  },
  requestUsageAccessPermission() {},
  hasSystemAlertWindowPermission() {
    return true;
  },
  requestSystemAlertWindowPermission() {},
  getInstalledApps() {
    return [
      { name: 'Instagram', packageName: 'com.instagram.android', domain: 'instagram.com' },
      { name: 'TikTok', packageName: 'com.zhiliaoapp.musically', domain: 'tiktok.com' },
      { name: 'Twitter / X', packageName: 'com.twitter.android', domain: 'twitter.com' },
      { name: 'Facebook', packageName: 'com.facebook.katana', domain: 'facebook.com' },
      { name: 'YouTube', packageName: 'com.google.android.youtube', domain: 'youtube.com' },
      { name: 'Reddit', packageName: 'com.reddit.frontpage', domain: 'reddit.com' },
      { name: 'Snapchat', packageName: 'com.snapchat.android', domain: 'snapchat.com' },
      { name: 'WhatsApp', packageName: 'com.whatsapp', domain: 'whatsapp.com' },
      { name: 'Telegram', packageName: 'org.telegram.messenger', domain: 'telegram.org' },
      { name: 'Discord', packageName: 'com.discord', domain: 'discord.com' },
    ].map(app => ({
      packageName: app.packageName,
      displayName: app.name,
      icon: `https://logo.clearbit.com/${app.domain}`
    }));
  },
  startBlocking(packages) {
    console.log('[Mock Block] Started monitoring for:', packages);
  },
  stopBlocking() {
    console.log('[Mock Block] Stopped monitoring');
  }
};

const ExpoAppBlocker: ExpoAppBlockerModuleType = nativeModule || mockModule;

export default ExpoAppBlocker;
