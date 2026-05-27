/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VisualSettings {
  text: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: number; // Percentage scale
  distortion: number; // 0 to 10
  flowSpeed: number; // 0 to 10
  glowIntensity: number; // 0 to 10
  colorPreset: 'deepspace';
  backgroundColor: string; // Hex color (defaults to #000000)
  motionBlur: number; // 0 to 10 (trail strength)
  noiseScale: number; // 0 to 10 (frequency of wave)
  audioSensitivity: number; // 0 to 10
  enableBeatGlitches: boolean;
}

export interface AudioAnalysis {
  volume: number; // 0.0 to 1.0
  bass: number;   // 0.0 to 1.0
  mid: number;    // 0.0 to 1.0
  high: number;   // 0.0 to 1.0
  isBeat: boolean;
  beatIntensity: number; // 0.0 to 1.0 (decays over time)
}
