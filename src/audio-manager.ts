import { AssetLoader } from './assets.js';
import { AUDIO } from './config.js';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private pelletBuffers: AudioBuffer[] = [];
  private powerPelletBuffer: AudioBuffer | null = null;
  private introBuffer: AudioBuffer | null = null;
  private sirenBuffers: AudioBuffer[] = [];
  private sirenSource: AudioBufferSourceNode | null = null;
  private currentSirenIndex: number = -1;
  private pelletSoundIndex: number = 0;
  private frightBuffer: AudioBuffer | null = null;
  private frightSource: AudioBufferSourceNode | null = null;
  private introSource: AudioBufferSourceNode | null = null;
  private deathBuffers: AudioBuffer[] = [];

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

      // Load siren sounds
      const sirenLoadPromises = AUDIO.SIRENS.map(url =>
        this.assetLoader.loadAudio(url, this.audioContext!)
      );
      this.sirenBuffers = await Promise.all(sirenLoadPromises);

      // Load power pellet sound
      try {
        this.powerPelletBuffer = await this.assetLoader.loadAudio(AUDIO.POWER_PELLET_SOUND, this.audioContext!);
      } catch (error) {
        console.warn('Failed to load power pellet sound:', error);
      }

      // Load intro sound
      try {
        this.introBuffer = await this.assetLoader.loadAudio(AUDIO.INTRO_SOUND, this.audioContext!);
      } catch (error) {
        console.warn('Failed to load intro sound:', error);
      }

      // Load fright sound
      try {
        this.frightBuffer = await this.assetLoader.loadAudio(AUDIO.FRIGHT_SOUND, this.audioContext!);
      } catch (error) {
        console.warn('Failed to load fright sound:', error);
      }

      // Load death sounds
      const deathLoadPromises = AUDIO.DEATH_SOUNDS.map(url =>
        this.assetLoader.loadAudio(url, this.audioContext!)
      );
      this.deathBuffers = await Promise.all(deathLoadPromises);
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

    this.introSource = this.audioContext.createBufferSource();
    this.introSource.buffer = this.introBuffer;
    this.introSource.connect(this.audioContext.destination);
    this.introSource.onended = () => {
      this.introSource = null;
    };
    this.introSource.start(this.audioContext.currentTime);
  }

  /**
   * Stops the intro music.
   */
  stopIntroMusic(): void {
    if (this.introSource) {
      try {
        this.introSource.stop();
      } catch {
        // Ignore errors
      }
      this.introSource.disconnect();
      this.introSource = null;
    }
  }

  /**
   * Stops all background sounds (siren, fright sound, intro music).
   */
  stopAll(): void {
    this.stopSiren();
    this.stopFrightSound();
    this.stopIntroMusic();
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
   * Plays the siren at the given index, looping.
   * If the requested siren is already playing, does nothing.
   * Stops any currently playing siren before starting the new one.
   */
  playSiren(index: number): void {
    if (!this.audioContext || this.sirenBuffers.length === 0) return;

    if (index < 0 || index >= this.sirenBuffers.length) return;

    // If the requested siren is already playing, do nothing
    if (this.currentSirenIndex === index && this.sirenSource) {
      return;
    }

    this.stopSiren();

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(console.error);
    }

    const buffer = this.sirenBuffers[index];
    if (buffer) {
      this.sirenSource = this.audioContext.createBufferSource();
      this.sirenSource.buffer = buffer;
      this.sirenSource.loop = true;
      this.sirenSource.connect(this.audioContext.destination);
      this.sirenSource.start(this.audioContext.currentTime);
      this.currentSirenIndex = index;
    }
  }

  /**
   * Stops the currently playing siren.
   */
  stopSiren(): void {
    if (this.sirenSource) {
      try {
        this.sirenSource.stop();
      } catch {
        // Ignore errors if already stopped
      }
      this.sirenSource.disconnect();
      this.sirenSource = null;
    }
    this.currentSirenIndex = -1;
  }

  /**
   * Internal helper to play an AudioBuffer.
   */
  private playSound(buffer: AudioBuffer): void {
    if (!this.audioContext) return;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(this.audioContext.currentTime);
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
      this.frightSource.start(this.audioContext.currentTime);
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

  /**
   * Plays the death sound sequence.
   */
  playDeathSequence(): void {
    if (!this.audioContext || this.deathBuffers.length === 0) return;

    this.stopAll();

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(console.error);
    }

    let startTime = this.audioContext.currentTime;

    this.deathBuffers.forEach(buffer => {
      const source = this.audioContext!.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext!.destination);
      source.start(startTime);
      startTime += buffer.duration;
    });
  }
}