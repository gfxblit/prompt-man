import { describe, it, expect, vi } from 'vitest';
import { AssetLoader } from './assets.js';

describe('AssetLoader', () => {
  it('loads an image and caches it', async () => {
    const loader = new AssetLoader();
    
    // Mocking Image
    const mockInstances: MockImage[] = [];
    class MockImage {
      _src: string = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        mockInstances.push(this);
      }
      set src(value: string) {
        this._src = value;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
      get src() { return this._src; }
    }
    
    vi.stubGlobal('Image', MockImage);

    const imgPromise = loader.loadImage('test.png');
    const img = await imgPromise;
    expect(img).toBe(mockInstances[0]);
    expect(loader.getImage('test.png')).toBe(mockInstances[0]);
    
    const img2 = await loader.loadImage('test.png');
    expect(img2).toBe(mockInstances[0]);
    expect(mockInstances.length).toBe(1);
  });
});
