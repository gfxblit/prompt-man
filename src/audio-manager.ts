import { AssetLoader } from './assets.js';
import { AUDIO } from './config.js';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private pelletBuffers: AudioBuffer[] = [];
  private powerPelletBuffer: AudioBuffer | null = null;
  private pelletSoundIndex: number = 0;

  constructor(private assetLoader: AssetLoader) {}

  /**
   * Initializes the AudioContext and loads required sound assets.
   */
  async initialize(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as Window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      
      if (!AudioContextClass) {
        return;
      }

      this.audioContext = new AudioContextClass();

      const loadPromises = AUDIO.PELLET_SOUNDS.map(url =>
        this.assetLoader.loadAudio(url, this.audioContext!)
      );

      this.pelletBuffers = await Promise.all(loadPromises);

      // Load power pellet sound
      try {
        this.powerPelletBuffer = await this.assetLoader.loadAudio(AUDIO.POWER_PELLET_SOUND, this.audioContext);
      } catch (error) {
        console.warn('Failed to load power pellet sound:', error);
      }
    } catch (error) {
      console.warn('AudioManager failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Resumes the AudioContext if it's suspended (browser autoplay policy).
   */
  async resumeIfNeeded(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Plays the next alternating pellet consumption sound.
   */
  playPelletSound(): void {
    if (!this.audioContext || this.pelletBuffers.length === 0) {
      return;
    }

    // Modern browsers might suspend the context until user interaction.
    // We try to resume it just in case, though it's better handled at input level.
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(console.error);
    }

    const buffer = this.pelletBuffers[this.pelletSoundIndex];
    if (buffer) {
      this.playSound(buffer);
    }

    this.pelletSoundIndex = (this.pelletSoundIndex + 1) % this.pelletBuffers.length;
  }

  /**
   * Plays the specific power pellet consumption sound.
   */
  playPowerPelletSound(): void {
    if (!this.audioContext || !this.powerPelletBuffer) {
      // Fallback to regular pellet sound if power pellet sound is not available
      this.playPelletSound();
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(console.error);
    }

    this.playSound(this.powerPelletBuffer);
  }

  /**
   * Internal helper to play an AudioBuffer.
   */
  private playSound(buffer: AudioBuffer): void {
    if (!this.audioContext) return;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }
}
