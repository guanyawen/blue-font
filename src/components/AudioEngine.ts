/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioAnalysis } from '../types';

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private fileSource: MediaElementAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  
  // Historical bass values for beat detection
  private bassHistory: number[] = [];
  private historySize = 45; // About 0.75s to 1s of frames
  private beatThreshold = 1.35; // Trigger threshold over average
  private beatHoldFrames = 15; // Minimum frames between beat detections
  private beatFrameCounter = 0;
  
  // Current analysis results
  public currentAnalysis: AudioAnalysis = {
    volume: 0,
    bass: 0,
    mid: 0,
    high: 0,
    isBeat: false,
    beatIntensity: 0,
  };

  constructor() {
    // Initial analysis state
  }

  public async initAudio(): Promise<boolean> {
    if (this.audioCtx) return true;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.75;
      return true;
    } catch (e) {
      console.error('Failed to initialize Web Audio API:', e);
      return false;
    }
  }

  public resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public async connectMicrophone(): Promise<boolean> {
    await this.initAudio();
    this.resumeContext();

    if (!this.audioCtx || !this.analyser) return false;

    // Disconnect existing mic if any
    this.disconnectMicrophone();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphoneSource = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.microphoneSource.connect(this.analyser);
      return true;
    } catch (e) {
      console.error('Microphone access denied:', e);
      return false;
    }
  }

  public disconnectMicrophone() {
    if (this.microphoneSource) {
      this.microphoneSource.disconnect();
      this.microphoneSource = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  public connectAudioElement(audioElement: HTMLAudioElement): boolean {
    this.initAudio();
    this.resumeContext();

    if (!this.audioCtx || !this.analyser) return false;

    // Disconnect existing file source if any
    if (this.fileSource) {
      try {
        this.fileSource.disconnect();
      } catch (e) {
        // Safe skip
      }
    }

    try {
      this.fileSource = this.audioCtx.createMediaElementSource(audioElement);
      this.fileSource.connect(this.analyser);
      // Connect to speakers so the user can listen to the audio file
      this.analyser.connect(this.audioCtx.destination);
      return true;
    } catch (e) {
      console.error('Audio element connection failed:', e);
      return false;
    }
  }

  public disconnectAudioElement() {
    if (this.fileSource) {
      try {
        this.fileSource.disconnect();
        if (this.analyser) {
          this.analyser.disconnect();
          // Connect back if needed
        }
      } catch (e) {
        // Safe skip
      }
      this.fileSource = null;
    }
  }

  public update(sensitivity: number): AudioAnalysis {
    // If audio engine is not initialized or analyser isn't run, return empty
    if (!this.analyser) {
      // Decay beat intensity even without audio input
      this.currentAnalysis.beatIntensity = Math.max(0, this.currentAnalysis.beatIntensity - 0.08);
      this.currentAnalysis.isBeat = false;
      return this.currentAnalysis;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    if (dataArray.length === 0) {
      return this.currentAnalysis;
    }

    // FFT bin analysis for ranges (At 44.1kHz, each bin is approx 44100 / 512 = 86Hz)
    // - Bass [20Hz - 150Hz]: bins 0 to 2
    // - Mid [150Hz - 2000Hz]: bins 3 to 24
    // - High [2000Hz - 10000Hz]: bins 25 to 110
    
    let total = 0;
    let bassSum = 0;
    let midSum = 0;
    let highSum = 0;

    for (let i = 0; i < bufferLength; i++) {
      const val = dataArray[i];
      total += val;

      if (i <= 2) {
        bassSum += val;
      } else if (i <= 24) {
        midSum += val;
      } else if (i <= 110) {
        highSum += val;
      }
    }

    const volume = (total / bufferLength) / 255;
    const bass = (bassSum / Math.max(1, 3)) / 255;
    const mid = (midSum / Math.max(1, 22)) / 255;
    const high = (highSum / Math.max(1, 86)) / 255;

    // Scale values by user sensitivity control
    const sensMultiplier = sensitivity * 0.2; // default sensitivity value is 5, so multipliers around 1.0
    const scaledVolume = Math.min(1.0, volume * sensMultiplier);
    const scaledBass = Math.min(1.0, bass * sensMultiplier);
    const scaledMid = Math.min(1.0, mid * sensMultiplier);
    const scaledHigh = Math.min(1.0, high * sensMultiplier);

    // --- Beat Detection ---
    this.beatFrameCounter++;
    this.bassHistory.push(scaledBass);
    if (this.bassHistory.length > this.historySize) {
      this.bassHistory.shift();
    }

    let isBeat = false;
    let averageBass = 0;

    if (this.bassHistory.length > 10) {
      const sum = this.bassHistory.reduce((a, b) => a + b, 0);
      averageBass = sum / this.bassHistory.length;
    }

    // Beat condition: current bass exceeds historical average bass by a threshold,
    // and must have cooled down enough frames, and must exceed a minimum energy baseline (e.g., 0.15)
    if (
      scaledBass > averageBass * this.beatThreshold &&
      scaledBass > 0.15 &&
      this.beatFrameCounter > this.beatHoldFrames
    ) {
      isBeat = true;
      this.beatFrameCounter = 0; // reset cooldown
      this.currentAnalysis.beatIntensity = 1.0; // trigger peak
    } else {
      // Decay beat intensity exponentially
      this.currentAnalysis.beatIntensity = Math.max(0, this.currentAnalysis.beatIntensity - 0.06);
    }

    this.currentAnalysis = {
      volume: scaledVolume,
      bass: scaledBass,
      mid: scaledMid,
      high: scaledHigh,
      isBeat: isBeat,
      beatIntensity: this.currentAnalysis.beatIntensity,
    };

    return this.currentAnalysis;
  }

  public cleanup() {
    this.disconnectMicrophone();
    this.disconnectAudioElement();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
