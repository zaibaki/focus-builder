# Focus App ⏱️🎵🛡️

A premium, feature-rich **React Native** application designed to help users concentrate. It combines an **ambient music player**, a **focus session timer**, **app blocking**, and **session statistics**. 

The app features a sleek dark-themed interface built using Expo, TypeScript, Zustand, and SQLite for 100% offline local data persistence.

---

## 📱 Features

### 1. ⏱️ Focus Timer (Home Screen)
*   **Visual Progress**: Large, beautiful circular progress ring drawn dynamically using `react-native-svg`.
*   **Presets & Customization**: Presets for 15m, 25m, 45m, 60m, and 90m focus sessions, alongside custom tags/labels (e.g. "Coding", "Writing").
*   **Full Timer Control**: Smooth flow transitioning between *Start*, *Pause*, *Resume*, and *Give Up* actions.
*   **Soothing Animated Background**: When music is playing, the screen background displays the current track's artwork softly faded and animated in a slow, soothing Ken Burns pan/zoom effect to create an immersive focus environment.
*   **Distraction Simulator**: Run a simulated distraction interception when a session is active to test the app blocker functionality and record stats.

### 2. 🎵 Sound Library & Ambient Mixer
*   **Curated Tracks**: Pre-seeded background tracks (e.g., Deep Focus, Rainfall, Ocean Waves, Café Ambience, birds, and cosmic ambient loops).
*   **Category Filters**: Swiftly browse tracks through horizontal chip filters (All, Ambient, Nature, Lo-Fi, White Noise, My Tracks).
*   **Track Importer**: Choose and import local audio files (MP3, WAV, etc.) using `expo-document-picker`. The files are copied into the app's sandboxed document directory and registered in SQLite.
*   **Ambient Sound Mixer**: Collapsible mixing board allowing users to blend volume levels of 4 sound channels (Rain, Birds, Café, Binaural beats) using custom volume swatches.
*   **Mix Seeding**: Save custom ambient mixes to SQLite database. They instantly appear and are playable in the "My Tracks" library.
*   **Persistent Mini Player**: Pinned bottom playback bar displaying current track artwork, title, playback controls, and a reactive progress bar.
*   **Auto-Advance**: Queue-based player that automatically advances to the next track when the current one finishes.

### 3. 🛡️ App Blocker & Mindfulness Nudge
*   **Custom Target Blocklist**: Toggle status switches to block distracting apps (Instagram, TikTok, Twitter/X, Facebook, YouTube, Reddit, WhatsApp, Discord, etc.).
*   **Local Persistence**: Active blocks are immediately written to SQLite.
*   **Mindful Breathing Overlay**: Full-screen modal warning ("Distraction Intercepted") that runs a 10-second guided breathing loop (Inhale / Exhale) with smooth animations to help break the impulse loop.
*   **Focus Integrity Commitment**: Option to request a 1-minute app pass by typing a specific focus commitment phrase exactly.

### 4. 📊 Focus Guild RPG Analytics (Stats Screen)
*   **Focus Guild Leveling**: RPG-style progression system. Every 30 minutes of completed focus time earns XP, increasing your level and unlocking higher Focus Ranks (e.g. *Focus Initiate*, *Deep Worker*, *Zen Monk*).
*   **Summary Cards**: Quick-glance cards showing *Total Focus Time*, *Completed Sessions*, and *Distraction Intercepts*.
*   **Weekly Bar Chart**: Interactive daily chart representing focus minutes per day, styled natively with `react-native-svg` and `react-native-reanimated`.
*   **Guild Achievements**: Dynamic badge achievement grid (🌱 *First Flow*, ⚔️ *Focus Knight*, 🛡️ *Iron Shield*, 🔥 *Unstoppable*, 🧘 *Zen Master*, and 📅 *Consistent*) that unlocks automatically based on your SQLite session stats.
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
*   `session_blocked_attempts`: Incident log tracks every distraction interception event matching the session, along with whether a mindful bypass was granted.
*   `custom_mixes`: Stores user-saved custom volume mixes of ambient loops.

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
