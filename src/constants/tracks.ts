/**
 * Bundled track metadata — maps to assets/images/tracks/ artwork
 * and will be seeded into the SQLite `tracks` table on first launch.
 */

export type TrackCategory = 'ambient' | 'nature' | 'lofi' | 'white_noise' | 'custom';

export interface BundledTrack {
  title: string;
  artist: string;
  category: TrackCategory;
  duration_sec: number;
  artwork: ReturnType<typeof require>;
  uri: string;
}

export const BUNDLED_TRACKS: BundledTrack[] = [
  {
    title: 'Deep Focus',
    artist: 'Focus App',
    category: 'ambient',
    duration_sec: 300,
    artwork: require('../../assets/images/tracks/deep_focus.jpg'),
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    title: 'Rainfall',
    artist: 'Focus App',
    category: 'nature',
    duration_sec: 360,
    artwork: require('../../assets/images/tracks/rainfall.jpg'),
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    title: 'Ocean Waves',
    artist: 'Focus App',
    category: 'nature',
    duration_sec: 420,
    artwork: require('../../assets/images/tracks/ocean_waves.jpg'),
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    title: 'Morning Birds',
    artist: 'Focus App',
    category: 'nature',
    duration_sec: 300,
    artwork: require('../../assets/images/tracks/morning_birds.jpg'),
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    title: 'Café Ambience',
    artist: 'Focus App',
    category: 'lofi',
    duration_sec: 480,
    artwork: require('../../assets/images/tracks/cafe_ambience.jpg'),
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    title: 'Cosmic Drift',
    artist: 'Focus App',
    category: 'ambient',
    duration_sec: 540,
    artwork: require('../../assets/images/tracks/cosmic_drift.jpg'),
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
];

export const CATEGORY_ARTWORK = {
  ambient: require('../../assets/images/categories/ambient.jpg'),
  nature: require('../../assets/images/categories/nature.jpg'),
  lofi: require('../../assets/images/categories/lofi.jpg'),
  white_noise: require('../../assets/images/categories/white_noise.jpg'),
} as const;

export const DEFAULT_ARTWORK = require('../../assets/images/tracks/default_artwork.jpg');

export const CATEGORIES: { key: TrackCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ambient', label: 'Ambient' },
  { key: 'nature', label: 'Nature' },
  { key: 'lofi', label: 'Lo-Fi' },
  { key: 'white_noise', label: 'White Noise' },
  { key: 'custom', label: 'My Tracks' },
];
