/**
 * Database Service — SQLite initialization, schema migrations, and query helpers
 */
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

// ─── Database Initialization ─────────────────────────────────────
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('focus.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await initSchema();
  return db;
}

async function initSchema(): Promise<void> {
  if (!db) return;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time          INTEGER NOT NULL,
      end_time            INTEGER,
      target_duration_sec INTEGER NOT NULL,
      actual_duration_sec INTEGER DEFAULT 0,
      status              TEXT NOT NULL CHECK(status IN ('active','completed','abandoned')),
      label               TEXT
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT NOT NULL,
      artist       TEXT DEFAULT 'Unknown',
      uri          TEXT UNIQUE NOT NULL,
      duration_sec INTEGER,
      category     TEXT DEFAULT 'ambient'
                       CHECK(category IN ('ambient','nature','lofi','white_noise','custom')),
      artwork_uri  TEXT,
      created_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_apps (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      package_name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      icon_uri     TEXT,
      is_active    INTEGER DEFAULT 1,
      created_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_blocked_attempts (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id     INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      package_name   TEXT NOT NULL,
      timestamp      INTEGER NOT NULL,
      bypass_granted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS session_tracks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      track_id   INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      played_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      position    INTEGER NOT NULL,
      PRIMARY KEY (playlist_id, track_id)
    );

    CREATE TABLE IF NOT EXISTS custom_mixes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      mix_config   TEXT NOT NULL,
      created_at   INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);
    CREATE INDEX IF NOT EXISTS idx_blocked_attempts_session ON session_blocked_attempts(session_id);
  `);

  // Migrate existing tables if they don't have the bypass_granted column
  try {
    await db.execAsync('ALTER TABLE session_blocked_attempts ADD COLUMN bypass_granted INTEGER DEFAULT 0;');
  } catch (e) {
    // Column already exists, ignore error
  }
}

// ─── Session Queries ─────────────────────────────────────────────
export interface Session {
  id: number;
  start_time: number;
  end_time: number | null;
  target_duration_sec: number;
  actual_duration_sec: number;
  status: 'active' | 'completed' | 'abandoned';
  label: string | null;
}

export async function createSession(
  targetDuration: number,
  label?: string
): Promise<number> {
  const database = await getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const result = await database.runAsync(
    'INSERT INTO sessions (start_time, target_duration_sec, status, label) VALUES (?, ?, ?, ?)',
    [now, targetDuration, 'active', label ?? null]
  );
  return result.lastInsertRowId;
}

export async function completeSession(
  sessionId: number,
  actualDuration: number
): Promise<void> {
  const database = await getDatabase();
  const now = Math.floor(Date.now() / 1000);
  await database.runAsync(
    'UPDATE sessions SET end_time = ?, actual_duration_sec = ?, status = ? WHERE id = ?',
    [now, actualDuration, 'completed', sessionId]
  );
}

export async function abandonSession(
  sessionId: number,
  actualDuration: number
): Promise<void> {
  const database = await getDatabase();
  const now = Math.floor(Date.now() / 1000);
  await database.runAsync(
    'UPDATE sessions SET end_time = ?, actual_duration_sec = ?, status = ? WHERE id = ?',
    [now, actualDuration, 'abandoned', sessionId]
  );
}

export async function getRecentSessions(limit: number = 20): Promise<Session[]> {
  const database = await getDatabase();
  return database.getAllAsync<Session>(
    'SELECT * FROM sessions ORDER BY start_time DESC LIMIT ?',
    [limit]
  );
}

export async function getSessionsForWeek(
  weekStartEpoch: number
): Promise<Session[]> {
  const database = await getDatabase();
  const weekEnd = weekStartEpoch + 7 * 24 * 60 * 60;
  return database.getAllAsync<Session>(
    'SELECT * FROM sessions WHERE start_time >= ? AND start_time < ? ORDER BY start_time',
    [weekStartEpoch, weekEnd]
  );
}

export async function getTotalFocusTime(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(actual_duration_sec), 0) as total FROM sessions WHERE status = 'completed'"
  );
  return result?.total ?? 0;
}

export async function getCompletedSessionCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'"
  );
  return result?.count ?? 0;
}

export async function getAbandonedSessionCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sessions WHERE status = 'abandoned'"
  );
  return result?.count ?? 0;
}

// ─── Track Queries ───────────────────────────────────────────────
export interface Track {
  id: number;
  title: string;
  artist: string;
  uri: string;
  duration_sec: number | null;
  category: string;
  artwork_uri: string | null;
  created_at: number;
}

export async function insertTrack(track: {
  title: string;
  artist: string;
  uri: string;
  duration_sec?: number;
  category?: string;
  artwork_uri?: string;
}): Promise<number> {
  const database = await getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const result = await database.runAsync(
    'INSERT OR IGNORE INTO tracks (title, artist, uri, duration_sec, category, artwork_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      track.title,
      track.artist,
      track.uri,
      track.duration_sec ?? null,
      track.category ?? 'ambient',
      track.artwork_uri ?? null,
      now,
    ]
  );
  return result.lastInsertRowId;
}

export async function getAllTracks(category?: string): Promise<Track[]> {
  const database = await getDatabase();
  if (category && category !== 'all') {
    return database.getAllAsync<Track>(
      'SELECT * FROM tracks WHERE category = ? ORDER BY title',
      [category]
    );
  }
  return database.getAllAsync<Track>('SELECT * FROM tracks ORDER BY title');
}

// ─── Blocked App Queries ────────────────────────────────────────
export interface BlockedApp {
  id: number;
  package_name: string;
  display_name: string;
  icon_uri: string | null;
  is_active: number;
  created_at: number;
}

export async function addBlockedApp(
  packageName: string,
  displayName: string,
  iconUri?: string
): Promise<number> {
  const database = await getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const result = await database.runAsync(
    'INSERT OR IGNORE INTO blocked_apps (package_name, display_name, icon_uri, created_at) VALUES (?, ?, ?, ?)',
    [packageName, displayName, iconUri ?? null, now]
  );
  return result.lastInsertRowId;
}

export async function removeBlockedApp(packageName: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE blocked_apps SET is_active = 0 WHERE package_name = ?',
    [packageName]
  );
}

export async function toggleBlockedApp(
  packageName: string,
  isActive: boolean
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE blocked_apps SET is_active = ? WHERE package_name = ?',
    [isActive ? 1 : 0, packageName]
  );
}

export async function getBlockedApps(): Promise<BlockedApp[]> {
  const database = await getDatabase();
  return database.getAllAsync<BlockedApp>(
    'SELECT * FROM blocked_apps WHERE is_active = 1 ORDER BY display_name'
  );
}

export async function getAllBlockedApps(): Promise<BlockedApp[]> {
  const database = await getDatabase();
  return database.getAllAsync<BlockedApp>(
    'SELECT * FROM blocked_apps ORDER BY display_name'
  );
}

// ─── Block Attempt Logging ──────────────────────────────────────
export async function logBlockAttempt(
  sessionId: number,
  packageName: string,
  bypassGranted: boolean = false
): Promise<void> {
  const database = await getDatabase();
  const now = Math.floor(Date.now() / 1000);
  await database.runAsync(
    'INSERT INTO session_blocked_attempts (session_id, package_name, timestamp, bypass_granted) VALUES (?, ?, ?, ?)',
    [sessionId, packageName, now, bypassGranted ? 1 : 0]
  );
}

export async function getBlockAttemptCount(sessionId?: number): Promise<number> {
  const database = await getDatabase();
  if (sessionId) {
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM session_blocked_attempts WHERE session_id = ?',
      [sessionId]
    );
    return result?.count ?? 0;
  }
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session_blocked_attempts'
  );
  return result?.count ?? 0;
}

export async function getWeeklyBlockAttempts(
  weekStartEpoch: number
): Promise<number> {
  const database = await getDatabase();
  const weekEnd = weekStartEpoch + 7 * 24 * 60 * 60;
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session_blocked_attempts WHERE timestamp >= ? AND timestamp < ?',
    [weekStartEpoch, weekEnd]
  );
  return result?.count ?? 0;
}

// ─── Custom Mixes Queries ────────────────────────────────────────
export interface CustomMix {
  id: number;
  name: string;
  mix_config: string;
  created_at: number;
}

export async function saveCustomMix(name: string, mixConfig: string): Promise<number> {
  const database = await getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const result = await database.runAsync(
    'INSERT INTO custom_mixes (name, mix_config, created_at) VALUES (?, ?, ?)',
    [name, mixConfig, now]
  );
  return result.lastInsertRowId;
}

export async function getCustomMixes(): Promise<CustomMix[]> {
  const database = await getDatabase();
  return database.getAllAsync<CustomMix>(
    'SELECT * FROM custom_mixes ORDER BY created_at DESC'
  );
}

export async function deleteCustomMix(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM custom_mixes WHERE id = ?', [id]);
}
