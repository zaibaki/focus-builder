import { ImageSourcePropType } from 'react-native';

/**
 * Visual Themes for the Focus Timer screen background
 */

export interface VisualTheme {
  id: string;
  name: string;
  image: ImageSourcePropType;
}

export const VISUAL_THEMES: VisualTheme[] = [
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    image: require('../../assets/images/tracks/deep_focus.jpg'),
  },
  {
    id: 'rainfall',
    name: 'Rainfall',
    image: require('../../assets/images/tracks/rainfall.jpg'),
  },
  {
    id: 'ocean_waves',
    name: 'Ocean Waves',
    image: require('../../assets/images/tracks/ocean_waves.jpg'),
  },
  {
    id: 'morning_birds',
    name: 'Morning Birds',
    image: require('../../assets/images/tracks/morning_birds.jpg'),
  },
  {
    id: 'cafe_ambience',
    name: 'Café Ambience',
    image: require('../../assets/images/tracks/cafe_ambience.jpg'),
  },
  {
    id: 'cosmic_drift',
    name: 'Cosmic Drift',
    image: require('../../assets/images/tracks/cosmic_drift.jpg'),
  },
];
