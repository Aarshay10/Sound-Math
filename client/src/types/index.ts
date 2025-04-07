// Audio Data Types
export interface AudioData {
  frequencyData: Uint8Array;
  timeData: Float32Array;
}

export interface ChordNote {
  name: string;
  octave?: number;
  frequency: number;
}

export interface Chord {
  name: string;
  formula: string;
  notes: ChordNote[];
  frequencies: number[];
}

// Visualization Types
export type VisualizationMode = 'harmonograph' | 'waveform' | 'particles' | 'fractal';
export type ColorScheme = 'default' | 'warm' | 'cool' | 'vibrant';

export interface VisualizationParams {
  sensitivity: number;
  complexity: number;
  decay: number;
}

// User Preferences
export interface UserPreferences {
  id: number;
  userId: string;
  mode: VisualizationMode;
  colorScheme: ColorScheme;
  sensitivity: number;
  complexity: number;
  decay: number;
}

export interface SavePreferencesRequest {
  mode: VisualizationMode;
  colorScheme: ColorScheme;
  sensitivity: number;
  complexity: number;
  decay: number;
}
