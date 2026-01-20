import { describe, it, expect } from 'vitest';
import { AssetLoader } from './assets.js';
import { setupMockImage } from './test-utils.js';

describe('AssetLoader', () => {
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
});
