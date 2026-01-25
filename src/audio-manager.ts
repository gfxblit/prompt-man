import { AssetLoader } from './assets.js';
import { AUDIO } from './config.js';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private pelletBuffers: AudioBuffer[] = [];
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
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    }

    this.pelletSoundIndex = (this.pelletSoundIndex + 1) % this.pelletBuffers.length;
  }

  /**
   * Future enhancement: play power pellet specific sound.
   * For now, it uses the same alternating pellet sounds.
   */
  playPowerPelletSound(): void {
    this.playPelletSound();
  }
}
