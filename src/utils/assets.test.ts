import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AssetLoader } from './assets.js';
import { setupMockImage, mockAudioContext } from './test-utils.js';

describe('AssetLoader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads an image and caches it', async () => {
    const loader = new AssetLoader();
    const mockInstances = setupMockImage();

    const imgPromise = loader.loadImage('test.png');
    const img = await imgPromise;
    expect(img).toBe(mockInstances[0]);
    expect(loader.getImage('test.png')).toBe(mockInstances[0]);
    
    const img2 = await loader.loadImage('test.png');
    expect(img2).toBe(mockInstances[0]);
    expect(mockInstances.length).toBe(1);
  });

  it('handles concurrent requests for the same image', async () => {
    const loader = new AssetLoader();
    const mockInstances = setupMockImage();

    // Multiple concurrent calls
    const [img1, img2, img3] = await Promise.all([
      loader.loadImage('test.png'),
      loader.loadImage('test.png'),
      loader.loadImage('test.png')
    ]);

    expect(img1).toBe(img2);
    expect(img2).toBe(img3);
    expect(mockInstances.length).toBe(1);
  });

  it('loads an audio file and caches it', async () => {
    const loader = new AssetLoader();
    const { context, mockBuffer } = mockAudioContext();
    
    const mockResponse = {
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const audioPromise = loader.loadAudio('test.wav', context);
    const audio = await audioPromise;
    expect(audio).toBe(mockBuffer);
    expect(loader.getAudio('test.wav')).toBe(mockBuffer);
    
    const audio2 = await loader.loadAudio('test.wav', context);
    expect(audio2).toBe(mockBuffer);
    expect(context.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it('handles concurrent requests for the same audio', async () => {
    const loader = new AssetLoader();
    const { context } = mockAudioContext();

    const mockResponse = {
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    // Multiple concurrent calls
    const [audio1, audio2, audio3] = await Promise.all([
      loader.loadAudio('test.wav', context),
      loader.loadAudio('test.wav', context),
      loader.loadAudio('test.wav', context)
    ]);

    expect(audio1).toBe(audio2);
    expect(audio2).toBe(audio3);
    expect(context.decodeAudioData).toHaveBeenCalledTimes(1);
  });
});
