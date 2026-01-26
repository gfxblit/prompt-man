import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioManager } from './audio-manager.js';
import { AssetLoader } from './assets.js';
import { mockAudioContext } from './test-utils.js';
import { AUDIO } from './config.js';

describe('AudioManager', () => {
  let assetLoader: AssetLoader;
  let audioManager: AudioManager;
  let mockCtx: ReturnType<typeof mockAudioContext>;

  beforeEach(() => {
    assetLoader = new AssetLoader();
    mockCtx = mockAudioContext();
    
    // Mock AudioContext constructor using a regular function so it can be used with 'new'
    const mockContextValue = mockCtx.context;
    const MockAudioContext = vi.fn(function() {
      return mockContextValue;
    });

    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('webkitAudioContext', MockAudioContext);

    // Mock AssetLoader.loadAudio
    vi.spyOn(assetLoader, 'loadAudio').mockResolvedValue(mockCtx.mockBuffer);

    audioManager = new AudioManager(assetLoader);
  });

  it('should initialize and load sounds', async () => {
    await audioManager.initialize();
    
    expect(window.AudioContext).toHaveBeenCalled();
    // Should load pellet sounds + power pellet sound + intro sound
    expect(assetLoader.loadAudio).toHaveBeenCalledTimes(AUDIO.PELLET_SOUNDS.length + 2);
    AUDIO.PELLET_SOUNDS.forEach(url => {
      expect(assetLoader.loadAudio).toHaveBeenCalledWith(url, mockCtx.context);
    });
    expect(assetLoader.loadAudio).toHaveBeenCalledWith(AUDIO.POWER_PELLET_SOUND, mockCtx.context);
    expect(assetLoader.loadAudio).toHaveBeenCalledWith(AUDIO.INTRO_SOUND, mockCtx.context);
  });

  it('should return intro duration', async () => {
    const introBuffer = { duration: 4.5 } as AudioBuffer;
    vi.spyOn(assetLoader, 'loadAudio')
      .mockResolvedValueOnce({} as AudioBuffer) // pellet 0
      .mockResolvedValueOnce({} as AudioBuffer) // pellet 1
      .mockResolvedValueOnce({} as AudioBuffer) // power pellet
      .mockResolvedValueOnce(introBuffer); // intro

    await audioManager.initialize();
    expect(audioManager.getIntroDuration()).toBe(4500);
  });

  it('should play intro music', async () => {
    const introBuffer = { duration: 4.5 } as AudioBuffer;
    vi.spyOn(assetLoader, 'loadAudio')
      .mockResolvedValueOnce({} as AudioBuffer)
      .mockResolvedValueOnce({} as AudioBuffer)
      .mockResolvedValueOnce({} as AudioBuffer)
      .mockResolvedValueOnce(introBuffer);

    await audioManager.initialize();
    audioManager.playIntroMusic();
    
    expect(mockCtx.context.createBufferSource).toHaveBeenCalled();
    expect(mockCtx.mockSource.buffer).toBe(introBuffer);
  });

  it('should play alternating pellet sounds', async () => {
    const buffer0 = { duration: 1 } as AudioBuffer;
    const buffer1 = { duration: 2 } as AudioBuffer;
    const powerBuffer = { duration: 3 } as AudioBuffer;
    vi.spyOn(assetLoader, 'loadAudio')
      .mockResolvedValueOnce(buffer0)
      .mockResolvedValueOnce(buffer1)
      .mockResolvedValueOnce(powerBuffer);

    await audioManager.initialize();
    
    // Play first pellet sound
    audioManager.playPelletSound();
    expect(mockCtx.context.createBufferSource).toHaveBeenCalledTimes(1);
    expect(mockCtx.mockSource.buffer).toBe(buffer0);

    // Play second pellet sound
    audioManager.playPelletSound();
    expect(mockCtx.context.createBufferSource).toHaveBeenCalledTimes(2);
    expect(mockCtx.mockSource.buffer).toBe(buffer1);

    // Play third pellet sound (loop back)
    audioManager.playPelletSound();
    expect(mockCtx.context.createBufferSource).toHaveBeenCalledTimes(3);
    expect(mockCtx.mockSource.buffer).toBe(buffer0);
  });

  it('should play power pellet sound and not affect pellet alternation', async () => {
    const buffer0 = { duration: 1 } as AudioBuffer;
    const buffer1 = { duration: 2 } as AudioBuffer;
    const powerBuffer = { duration: 3 } as AudioBuffer;
    vi.spyOn(assetLoader, 'loadAudio')
      .mockResolvedValueOnce(buffer0)
      .mockResolvedValueOnce(buffer1)
      .mockResolvedValueOnce(powerBuffer);

    await audioManager.initialize();
    
    // Regular pellet
    audioManager.playPelletSound();
    expect(mockCtx.mockSource.buffer).toBe(buffer0);

    // Power pellet
    audioManager.playPowerPelletSound();
    expect(mockCtx.mockSource.buffer).toBe(powerBuffer);

    // Regular pellet (should be the second one, not loop back yet)
    audioManager.playPelletSound();
    expect(mockCtx.mockSource.buffer).toBe(buffer1);
  });

  it('should resume audio context if suspended', async () => {
    await audioManager.initialize();
    vi.spyOn(mockCtx.context, 'state', 'get').mockReturnValue('suspended');
    
    await audioManager.resumeIfNeeded();
    expect(mockCtx.context.resume).toHaveBeenCalled();
  });

  it('should not resume if already running', async () => {
    await audioManager.initialize();
    vi.spyOn(mockCtx.context, 'state', 'get').mockReturnValue('running');
    
    await audioManager.resumeIfNeeded();
    expect(mockCtx.context.resume).not.toHaveBeenCalled();
  });

  it('should handle initialization errors gracefully', async () => {
    vi.spyOn(assetLoader, 'loadAudio').mockRejectedValue(new Error('Load failed'));
    
    await expect(audioManager.initialize()).rejects.toThrow('Load failed');
  });
});
