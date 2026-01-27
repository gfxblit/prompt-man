import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
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
    const MockAudioContext = vi.fn(function () {
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
    // Should load pellet sounds + siren sounds + power pellet sound + intro sound + fright sound + death sounds
    const expectedCalls = AUDIO.PELLET_SOUNDS.length + AUDIO.SIRENS.length + 3 + AUDIO.DEATH_SOUNDS.length;
    expect(assetLoader.loadAudio).toHaveBeenCalledTimes(expectedCalls);
    AUDIO.PELLET_SOUNDS.forEach(url => {
      expect(assetLoader.loadAudio).toHaveBeenCalledWith(url, mockCtx.context);
    });
    AUDIO.SIRENS.forEach(url => {
      expect(assetLoader.loadAudio).toHaveBeenCalledWith(url, mockCtx.context);
    });
    expect(assetLoader.loadAudio).toHaveBeenCalledWith(AUDIO.POWER_PELLET_SOUND, mockCtx.context);
    expect(assetLoader.loadAudio).toHaveBeenCalledWith(AUDIO.INTRO_SOUND, mockCtx.context);
    expect(assetLoader.loadAudio).toHaveBeenCalledWith(AUDIO.FRIGHT_SOUND, mockCtx.context);
    AUDIO.DEATH_SOUNDS.forEach(url => {
      expect(assetLoader.loadAudio).toHaveBeenCalledWith(url, mockCtx.context);
    });
  });

  it('should return intro duration', async () => {
    const introBuffer = { duration: 4.5 } as AudioBuffer;
    const sirenBuffer = { duration: 0.5 } as AudioBuffer;

    const mockLoad = vi.spyOn(assetLoader, 'loadAudio');

    // PELLET_SOUNDS (2)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    // SIRENS (4)
    for (let i = 0; i < 4; i++) {
      mockLoad.mockResolvedValueOnce(sirenBuffer);
    }

    // POWER_PELLET (1)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    // INTRO (1)
    mockLoad.mockResolvedValueOnce(introBuffer);

    // FRIGHT (1)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    // DEATH (2) - Fallback to default mock or we can explicit them
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    await audioManager.initialize();
    expect(audioManager.getIntroDuration()).toBe(4500);
  });

  it('should play intro music', async () => {
    const introBuffer = { duration: 4.5 } as AudioBuffer;
    const sirenBuffer = { duration: 0.5 } as AudioBuffer;

    const mockLoad = vi.spyOn(assetLoader, 'loadAudio');

    // PELLET_SOUNDS (2)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    // SIRENS (4)
    for (let i = 0; i < 4; i++) {
      mockLoad.mockResolvedValueOnce(sirenBuffer);
    }

    // POWER_PELLET (1)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    // INTRO (1)
    mockLoad.mockResolvedValueOnce(introBuffer);

    // FRIGHT (1)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    // DEATH (2)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    await audioManager.initialize();
    audioManager.playIntroMusic();

    expect(mockCtx.context.createBufferSource).toHaveBeenCalled();
    expect(mockCtx.mockSource.buffer).toBe(introBuffer);
  });

  it('should play alternating pellet sounds', async () => {
    const buffer0 = { duration: 1 } as AudioBuffer;
    const buffer1 = { duration: 2 } as AudioBuffer;
    const sirenBuffer = { duration: 0.5 } as AudioBuffer;
    const powerBuffer = { duration: 3 } as AudioBuffer;
    const introBuffer = { duration: 3.5 } as AudioBuffer;
    const frightBuffer = { duration: 4 } as AudioBuffer;

    const mockLoad = vi.spyOn(assetLoader, 'loadAudio');

    // PELLET_SOUNDS (2)
    mockLoad.mockResolvedValueOnce(buffer0);
    mockLoad.mockResolvedValueOnce(buffer1);

    // SIRENS (4)
    for (let i = 0; i < 4; i++) {
      mockLoad.mockResolvedValueOnce(sirenBuffer);
    }

    // POWER_PELLET (1)
    mockLoad.mockResolvedValueOnce(powerBuffer);

    // INTRO (1)
    mockLoad.mockResolvedValueOnce(introBuffer);

    // FRIGHT (1)
    mockLoad.mockResolvedValueOnce(frightBuffer);
    
    // DEATH (2)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

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
    const sirenBuffer = { duration: 0.5 } as AudioBuffer;
    const powerBuffer = { duration: 3 } as AudioBuffer;
    const introBuffer = { duration: 3.5 } as AudioBuffer;
    const frightBuffer = { duration: 4 } as AudioBuffer;

    const mockLoad = vi.spyOn(assetLoader, 'loadAudio');

    // PELLET_SOUNDS (2)
    mockLoad.mockResolvedValueOnce(buffer0);
    mockLoad.mockResolvedValueOnce(buffer1);

    // SIRENS (4)
    for (let i = 0; i < 4; i++) {
      mockLoad.mockResolvedValueOnce(sirenBuffer);
    }

    // POWER_PELLET (1)
    mockLoad.mockResolvedValueOnce(powerBuffer);

    // INTRO (1)
    mockLoad.mockResolvedValueOnce(introBuffer);

    // FRIGHT (1)
    mockLoad.mockResolvedValueOnce(frightBuffer);

    // DEATH (2)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

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

  it('should play death sequence', async () => {
    const deathBuffer0 = { duration: 1.5 } as AudioBuffer;
    const deathBuffer1 = { duration: 2.5 } as AudioBuffer;
    
    const mockLoad = vi.spyOn(assetLoader, 'loadAudio');
    
    // We need to provide return values for all calls to loadAudio up to the death sounds
    // PELLET_SOUNDS (2)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    // SIRENS (4)
    for (let i = 0; i < 4; i++) {
      mockLoad.mockResolvedValueOnce({} as AudioBuffer);
    }

    // POWER_PELLET (1)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    // INTRO (1)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);

    // FRIGHT (1)
    mockLoad.mockResolvedValueOnce({} as AudioBuffer);
    
    // DEATH (2)
    mockLoad.mockResolvedValueOnce(deathBuffer0);
    mockLoad.mockResolvedValueOnce(deathBuffer1);
    
    await audioManager.initialize();
    
    // Reset mockSource to clear previous calls (though createBufferSource creates new ones)
    vi.clearAllMocks();
    
    // Re-setup the createBufferSource mock to capture the sources returned
    const sources: {
      buffer: AudioBuffer | null;
      connect: Mock;
      start: Mock;
      stop: Mock;
      disconnect: Mock;
    }[] = [];
    (mockCtx.context.createBufferSource as Mock).mockImplementation(() => {
        const source = {
            buffer: null,
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            disconnect: vi.fn()
        };
        sources.push(source);
        return source;
    });
    
    audioManager.playDeathSequence();
    
    expect(sources.length).toBe(2);
    expect(sources[0].buffer).toBe(deathBuffer0);
    expect(sources[1].buffer).toBe(deathBuffer1);
    
    expect(sources[0].start).toHaveBeenCalledWith(mockCtx.context.currentTime);
    expect(sources[1].start).toHaveBeenCalledWith(mockCtx.context.currentTime + deathBuffer0.duration);
  });

  it('should start and stop fright sound', async () => {
    const mockLoad = vi.spyOn(assetLoader, 'loadAudio');
    
    // PELLET_SOUNDS (2)
    mockLoad.mockResolvedValue({} as AudioBuffer);

    // Override specific calls if needed, but here we just need to ensure frightBuffer ends up in the manager
    // The current mock setup in beforeEach uses mockCtx.mockBuffer for everything unless overridden.
    // We can rely on that or be specific.
    
    // Let's just let it load default mocks, but we need to know WHICH one is fright.
    // Actually, initialize loads them in order.
    // We can just spy on createBufferSource to see what buffer is passed.
    
    await audioManager.initialize();
    
    // Manually inject the buffer into the private field if we can't easily control which one is which via mocks
    // OR, better, just rely on the fact that we can call startFrightSound and it should do something.
    // But we need the buffer to be non-null. It will be mockBuffer.
    
    audioManager.startFrightSound();
    
    expect(mockCtx.context.createBufferSource).toHaveBeenCalled();
    expect(mockCtx.mockSource.loop).toBe(true);
    expect(mockCtx.mockSource.start).toHaveBeenCalled();
    
    audioManager.stopFrightSound();
    expect(mockCtx.mockSource.stop).toHaveBeenCalled();
  });

  it('should play siren and switch sirens', async () => {
    await audioManager.initialize();
    
    audioManager.playSiren(0);
    expect(mockCtx.context.createBufferSource).toHaveBeenCalled();
    
    // Reset mocks to track new calls
    vi.clearAllMocks();
    // We need to ensure the next call creates a NEW source, which our mock does
    
    // Switch siren
    audioManager.playSiren(1);
    expect(mockCtx.context.createBufferSource).toHaveBeenCalled();
    // It should stop the previous one (we can't easily check previous instance with single mockSource object unless we captured it, but we can check if stop was called at least once if we didn't clear mocks, or if we rely on the fact that stopSiren calls stop)
    // Actually, since we cleared mocks, if stop is called it must be on the OLD source (which was mockSource).
    // But wait, if we cleared mocks, the old mockSource spy history is gone.
    // However, the audioManager holds a reference to the OLD source.
    // That old source is the SAME OBJECT `mockCtx.mockSource` because our mock factory returns the same object or we rely on the mock implementation in `beforeEach` which returns `mockCtx.mockSource`.
    // Wait, `test-utils` mockAudioContext returns a `mockSource` object.
    // `createBufferSource` mock returns `mockSource`.
    // So all sources are the same object.
    // So if we call stop() on it, we can spy it.
    
    expect(mockCtx.mockSource.stop).toHaveBeenCalled();
  });

  it('should ignore invalid siren index', async () => {
    await audioManager.initialize();
    vi.clearAllMocks();
    
    audioManager.playSiren(-1);
    audioManager.playSiren(99);
    
    expect(mockCtx.context.createBufferSource).not.toHaveBeenCalled();
  });
});
