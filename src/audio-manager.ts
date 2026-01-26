import { AssetLoader } from './assets.js';
import { AUDIO } from './config.js';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private pelletBuffers: AudioBuffer[] = [];
  private powerPelletBuffer: AudioBuffer | null = null;
  private introBuffer: AudioBuffer | null = null;
  private pelletSoundIndex: number = 0;
  private frightBuffer: AudioBuffer | null = null;
  private frightSource: AudioBufferSourceNode | null = null;

  constructor(private assetLoader: AssetLoader) { }

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

      // Load intro sound
      try {
        this.introBuffer = await this.assetLoader.loadAudio(AUDIO.INTRO_SOUND, this.audioContext);
      } catch (error) {
        console.warn('Failed to load intro sound:', error);
      }

      // Load fright sound
      try {
        this.frightBuffer = await this.assetLoader.loadAudio(AUDIO.FRIGHT_SOUND, this.audioContext);
      } catch (error) {
        console.warn('Failed to load fright sound:', error);
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
   * Plays the intro music.
   */
  playIntroMusic(): void {
    if (!this.audioContext || !this.introBuffer) {
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(console.error);
    }

    this.playSound(this.introBuffer);
  }

  /**
   * Returns the duration of the intro music in milliseconds.
   */
  getIntroDuration(): number {
    return this.introBuffer ? this.introBuffer.duration * 1000 : 0;
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

  /**
   * Starts the fright sound loop if not already playing.
   */
  startFrightSound(): void {
    if (!this.audioContext || !this.frightBuffer) return;

    // Resume context if needed
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(console.error);
    }

    // Don't restart if already playing
    if (this.frightSource) return;

    try {
      this.frightSource = this.audioContext.createBufferSource();
      this.frightSource.buffer = this.frightBuffer;
      this.frightSource.loop = true;
      this.frightSource.connect(this.audioContext.destination);
      this.frightSource.start(0);
    } catch (e) {
      console.error('Error starting fright sound:', e);
      this.frightSource = null;
    }
  }

  /**
   * Stops the fright sound loop.
   */
  stopFrightSound(): void {
    if (this.frightSource) {
      try {
        this.frightSource.stop();
      } catch {
        // Ignore errors on stop (e.g. if already stopped or invalid state)
      }
      this.frightSource = null;
    }
  }
}
