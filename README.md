# Focus App ⏱️🎵🛡️

A premium, feature-rich **React Native** application designed to help users concentrate. It combines an **ambient music player**, a **focus session timer**, **app blocking**, and **session statistics**. 

The app features a sleek dark-themed interface built using Expo, TypeScript, Zustand, and SQLite for 100% offline local data persistence.

---

## 📱 Features

### 1. ⏱️ Focus Timer (Home Screen)
*   **Visual Progress**: Large, beautiful circular progress ring drawn dynamically using `react-native-svg`.
*   **Presets & Customization**: Presets for 15m, 25m, 45m, 60m, and 90m focus sessions, alongside custom tags/labels (e.g. "Coding", "Writing").
*   **Full Timer Control**: Smooth flow transitioning between *Start*, *Pause*, *Resume*, and *Give Up* actions.
*   **Distraction Simulator**: Run a simulated distraction interception when a session is active to test the app blocker functionality and record stats.

### 2. 🎵 Sound Library
*   **Curated Tracks**: Pre-seeded background tracks (e.g., Deep Focus, Rainfall, Ocean Waves, Café Ambience, birds, and cosmic ambient loops).
*   **Category Filters**: Swiftly browse tracks through horizontal chip filters (All, Ambient, Nature, Lo-Fi, White Noise, Custom).
*   **Persistent Mini Player**: Pinned bottom playback bar displaying current track artwork, title, playback controls, and a reactive progress bar.
*   **Auto-Advance**: Queue-based player that automatically advances to the next track when the current one finishes.

### 3. 🛡️ App Blocker (Blocklist Management)
*   **Custom Target Blocklist**: Toggle status switches to block distracting apps (Instagram, TikTok, Twitter/X, Facebook, YouTube, Reddit, WhatsApp, Discord, etc.).
*   **Local Persistence**: Active blocks are immediately written to SQLite.
*   **App Interception Overlay**: Full-screen modal warning ("Distraction Detected!") that pops up to keep you on track, carrying a 3-second auto-return countdown and manual dismiss actions.

### 4. 📊 Progress Analytics (Stats Screen)
*   **Summary Cards**: Quick-glance cards showing *Total Focus Time*, *Completed Sessions*, and *Distraction Intercepts*.
*   **Weekly Bar Chart**: Interactive daily chart representing focus minutes per day, styled natively with `react-native-svg` and `react-native-reanimated`.
*   **Detailed History**: Chronological log of recent focus sessions, complete with actual/target durations and completion badges (Completed / Abandoned).
*   **Pull-to-Refresh**: Refresh stats from SQLite database instantly.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Expo (SDK 56)** | Managed workflow with custom native-capability compatibility |
| **Language** | **TypeScript** | Strict type safety across components, hooks, and stores |
| **Navigation** | **Expo Router** | Modern file-based navigation layout |
| **State** | **Zustand** | Lightweight, high-performance state slices (`useTimerStore`, `usePlayerStore`, `useBlockStore`) |
| **Database** | **expo-sqlite** | Local relational database for persistent session logging and app blocker configurations |
| **Animations** | **react-native-reanimated** | Fluid, native-thread 60fps animations for charts and progress UI |
| **Visuals** | **react-native-svg** | Vector graphics for high-fidelity tab bar icons, circular timer, and weekly charts |

---

## 🗄️ Database Schema

The app configures a local SQLite database (`focus.db`) on startup containing:
*   `sessions`: Stores focus start/end timestamps, targets, actual seconds focused, labels, and state (`active`, `completed`, `abandoned`).
*   `blocked_apps`: List of packages/apps blocklisted by the user.
*   `session_blocked_attempts`: Incident log tracks every distraction interception event matching the session.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and the Android/iOS toolchains set up (Android Studio for Android Emulators).

### Installation
1.  **Clone the repository** and navigate to the project directory:
    ```bash
    cd focus
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Run the App
To start the Metro Bundler and open the app on your emulator or device:

1.  **Start Metro** (with Electron sandboxing disabled for DevTools on Linux):
    ```bash
    ELECTRON_DISABLE_SANDBOX=1 npx expo start
    ```
2.  **Launch on Devices**:
    *   Press **`a`** to open in your Android Emulator.
    *   Press **`w`** to open in your Web Browser.
    *   Scan the terminal QR code using **Expo Go** on your physical iOS/Android phone.

---

## 📁 Project Structure

```
src/
├── app/                          # Expo Router routes
│   ├── (tabs)/
│   │   ├── index.tsx             # Timer Screen
│   │   ├── music.tsx             # Sound Library Screen
│   │   ├── blocklist.tsx         # App Blocker Screen
│   │   ├── stats.tsx             # Analytics Screen
│   │   └── _layout.tsx           # Tab Navigator styling
│   └── _layout.tsx               # Providers & DB initialization
├── components/                   # Sub-feature UI components
│   ├── blocker/                  # Blocker items & overlay modal
│   ├── music/                    # Track cards, chips, & mini player
│   ├── stats/                    # Weekly SVG bar chart
│   └── timer/                    # Circular progress ring
├── constants/                    # Design tokens & seed metadata
│   ├── colors.ts                 # Theme Colors & Typography
│   └── tracks.ts                 # Seeding audio tracks
├── hooks/                        # Custom React hooks
│   └── useAudioPlayback.ts       # Audio queue & progress manager
├── services/                     # Native services
│   └── database.ts               # SQLite driver & SQL queries
└── stores/                       # Zustand store slices
    ├── useBlockStore.ts          # Blocklist state manager
    ├── usePlayerStore.ts         # Sound library playback state
    └── useTimerStore.ts          # Active focus timer state
```
