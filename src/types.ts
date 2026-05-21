/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VerseSuggestion {
  text: string;
  reference: string;
  theme: string;
  reflectionPrompt?: string;
}

export type ThemePresetId = 'celestial' | 'sunset' | 'mountain' | 'nebula' | 'fog' | 'luxury-gold' | 'minimal-dark' | 'forest';

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  url: string;
  description: string;
  textClass: string;
}

export interface ShortConfig {
  id: string;
  verse: string;
  reference: string;
  title: string;
  reflection: string;
  voiceName: 'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir';
  audioBase64?: string;
  backgroundType: 'preset' | 'ai' | 'color';
  backgroundPresetId: ThemePresetId;
  backgroundMediaUrl: string; // holds generated base64 or absolute preset image URL
  overlayOpacity: number; // 0 to 100
  fontFamily: 'serif' | 'sans' | 'mono';
  textAlignment: 'center' | 'left' | 'right';
  textColor: string;
  textPosition: 'top' | 'center' | 'bottom';
  accentColor: string;
  logoType: 'bible' | 'cross' | 'heart' | 'none';
  hashtags: string[];
  youtubeDescription: string;
  watermarkText: string;
}
