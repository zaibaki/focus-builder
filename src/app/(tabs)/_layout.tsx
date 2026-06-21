/**
 * Tab Layout — Bottom tab navigator with custom SVG icons and dark theme
 */
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import Svg, { Circle, Line, Path, Rect, Polyline } from 'react-native-svg';
import { Colors } from '../../constants/colors';

// ─── SVG Tab Icons ───────────────────────────────────────────────

interface IconProps {
  color: any;
  size: number;
}

function TimerIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Clock face */}
      <Circle cx="12" cy="13" r="9" stroke={color} strokeWidth={1.8} />
      {/* Top knob */}
      <Line x1="12" y1="2" x2="12" y2="4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Minute hand */}
      <Line x1="12" y1="13" x2="12" y2="8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Hour hand */}
      <Line x1="12" y1="13" x2="16" y2="13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Center dot */}
      <Circle cx="12" cy="13" r="1.2" fill={color} />
    </Svg>
  );
}

function MusicIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Note stem */}
      <Path
        d="M9 18V6l12-3v12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-left note head */}
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth={1.8} />
      {/* Bottom-right note head */}
      <Circle cx="18" cy="15" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function ShieldIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.4 4.6-1.25 8-6.15 8-11.4V6l-8-4z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Checkmark inside */}
      <Polyline
        points="9,12 11,14 15,10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChartIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bars */}
      <Rect x="4" y="14" width="4" height="7" rx="1" stroke={color} strokeWidth={1.8} />
      <Rect x="10" y="8" width="4" height="13" rx="1" stroke={color} strokeWidth={1.8} />
      <Rect x="16" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function GearIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Tab Layout ──────────────────────────────────────────────────

const ICON_SIZE = 22;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color }) => <TimerIcon color={color} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: 'Music',
          tabBarIcon: ({ color }) => <MusicIcon color={color} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="blocklist"
        options={{
          title: 'Blocklist',
          tabBarIcon: ({ color }) => <ShieldIcon color={color} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <ChartIcon color={color} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <GearIcon color={color} size={ICON_SIZE} />,
        }}
      />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
});
