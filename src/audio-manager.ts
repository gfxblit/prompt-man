import { AssetLoader } from './assets.js';
import { AUDIO } from './config.js';
import { EventBus } from './event-bus.js';
import { GameEvent, TileType } from './types.js';

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
  private eatGhostBuffer: AudioBuffer | null = null;
  private eyesBuffer: AudioBuffer | null = null;
  private eyesSource: AudioBufferSourceNode | null = null;
  private deathBuffers: AudioBuffer[] = [];

  constructor(private assetLoader: AssetLoader, private eventBus?: EventBus) {
    if (this.eventBus) {
      this.setupEventListeners();
    }
  }

  private setupEventListeners(): void {
    if (!this.eventBus) return;

    this.eventBus.on(GameEvent.PELLET_EATEN, (data) => {
      if (data === TileType.PowerPellet) {
        this.playPowerPelletSound();
      } else {
        this.playPelletSound();
      }
    });

    this.eventBus.on(GameEvent.GHOST_EATEN, () => {
      this.playEatGhostSound();
    });

    this.eventBus.on(GameEvent.PACMAN_DEATH, () => {
      this.stopAll();
      this.playDeathSequence();
    });

    this.eventBus.on(GameEvent.READY_START, () => {
      this.stopAll();
    });

    this.eventBus.on(GameEvent.LEVEL_START, () => {
      this.stopAll();
    });

    this.eventBus.on(GameEvent.LEVEL_COMPLETE, () => {
      this.stopAll();
    });

    this.eventBus.on(GameEvent.SIREN_PLAY, (data) => {
      this.stopFrightSound();
      this.stopEyesSound();
      if (typeof data === 'number') {
        this.playSiren(data);
      }
    });

    this.eventBus.on(GameEvent.FRIGHT_START, () => {
      this.stopSiren();
      this.stopEyesSound();
      this.startFrightSound();
    });

    this.eventBus.on(GameEvent.EYES_START, () => {
      this.stopSiren();
      this.stopFrightSound();
      this.startEyesSound();
    });
  }

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

      this.pelletBuffers = await this.loadAudioBuffers(AUDIO.PELLET_SOUNDS);
      this.sirenBuffers = await this.loadAudioBuffers(AUDIO.SIRENS);
      this.powerPelletBuffer = await this.loadSingleAudio(AUDIO.POWER_PELLET_SOUND, 'power pellet');
      this.introBuffer = await this.loadSingleAudio(AUDIO.INTRO_SOUND, 'intro');
      this.frightBuffer = await this.loadSingleAudio(AUDIO.FRIGHT_SOUND, 'fright');
      this.eatGhostBuffer = await this.loadSingleAudio(AUDIO.GHOST_EATEN_SOUND, 'ghost eaten');
      this.eyesBuffer = await this.loadSingleAudio(AUDIO.EYES_SOUND, 'eyes');
      this.deathBuffers = await this.loadAudioBuffers(AUDIO.DEATH_SOUNDS);
    } catch (error) {
      console.warn('AudioManager failed to initialize:', error);
      throw error;
    }
  }

  private async loadAudioBuffers(urls: readonly string[]): Promise<AudioBuffer[]> {
    return await Promise.all(urls.map(url =>
      this.assetLoader.loadAudio(url, this.audioContext!)
    ));
  }

  private async loadSingleAudio(url: string, name: string): Promise<AudioBuffer | null> {
    try {
      return await this.assetLoader.loadAudio(url, this.audioContext!);
    } catch (error) {
      console.warn(`Failed to load ${name} sound:`, error);
      return null;
    }
  }

  /**
   * Returns the current state of the AudioContext.
   */
  getState(): AudioContextState | 'uninitialized' {
    return this.audioContext ? this.audioContext.state : 'uninitialized';
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

    this.resumeContextIfNeeded();

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
    this.stopEyesSound();
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

    this.resumeContextIfNeeded();

    const buffer = this.pelletBuffers[this.pelletSoundIndex];
    if (buffer) {
      this.playSound(buffer);
    }

    this.pelletSoundIndex = (this.pelletSoundIndex + 1) % this.pelletBuffers.length;
  }

  /**
   * Plays the ghost eaten sound.
   */
  playEatGhostSound(): void {
    if (!this.audioContext || !this.eatGhostBuffer) {
      return;
    }

    this.resumeContextIfNeeded();

    this.playSound(this.eatGhostBuffer);
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

    this.resumeContextIfNeeded();

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

    this.resumeContextIfNeeded();

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
   * Resumes the AudioContext if it's suspended (browser autoplay policy).
   */
  private resumeContextIfNeeded(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(console.error);
    }
  }

  /**
   * Starts the fright sound loop if not already playing.
   */
  startFrightSound(): void {
    if (!this.audioContext || !this.frightBuffer) return;

    // Resume context if needed
    this.resumeContextIfNeeded();

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
      this.frightSource.disconnect();
      this.frightSource = null;
    }
  }

  /**
   * Starts the eyes sound loop if not already playing.
   */
  startEyesSound(): void {
    if (!this.audioContext || !this.eyesBuffer) return;

    // Resume context if needed
    this.resumeContextIfNeeded();

    // Don't restart if already playing
    if (this.eyesSource) return;

    try {
      this.eyesSource = this.audioContext.createBufferSource();
      this.eyesSource.buffer = this.eyesBuffer;
      this.eyesSource.loop = true;
      this.eyesSource.connect(this.audioContext.destination);
      this.eyesSource.start(this.audioContext.currentTime);
    } catch (e) {
      console.error('Error starting eyes sound:', e);
      this.eyesSource = null;
    }
  }

  /**
   * Stops the eyes sound loop.
   */
  stopEyesSound(): void {
    if (this.eyesSource) {
      try {
        this.eyesSource.stop();
      } catch {
        // Ignore errors on stop (e.g. if already stopped or invalid state)
      }
      this.eyesSource.disconnect();
      this.eyesSource = null;
    }
  }


  /**
   * Plays the death sound sequence.
   */
  playDeathSequence(): void {
    if (!this.audioContext || this.deathBuffers.length === 0) return;

    this.stopAll();

    this.resumeContextIfNeeded();

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