/**
 * Utility for loading and caching game assets
 */
export class AssetLoader {
  private images: Map<string, HTMLImageElement> = new Map();
  private pendingImageRequests: Map<string, Promise<HTMLImageElement>> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private pendingAudioRequests: Map<string, Promise<AudioBuffer>> = new Map();

  /**
   * Loads an image from the specified URL. Returns a cached version if already loaded.
   */
  async loadImage(url: string): Promise<HTMLImageElement> {
    const cached = this.images.get(url);
    if (cached) {
      return cached;
    }

    const pending = this.pendingImageRequests.get(url);
    if (pending) {
      return pending;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(url, img);
        this.pendingImageRequests.delete(url);
        resolve(img);
      };
      img.onerror = () => {
        this.pendingImageRequests.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });

    this.pendingImageRequests.set(url, promise);
    return promise;
  }

  /**
   * Synchronously retrieves a previously loaded image.
   */
  getImage(url: string): HTMLImageElement | undefined {
    return this.images.get(url);
  }

  /**
   * Loads an audio file from the specified URL. Returns a cached version if already loaded.
   */
  async loadAudio(url: string, context: AudioContext): Promise<AudioBuffer> {
    const cached = this.audioBuffers.get(url);
    if (cached) {
      return cached;
    }

    const pending = this.pendingAudioRequests.get(url);
    if (pending) {
      return pending;
    }

    const promise = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${url} (${response.status} ${response.statusText})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(url, audioBuffer);
        return audioBuffer;
      } finally {
        this.pendingAudioRequests.delete(url);
      }
    })();

    this.pendingAudioRequests.set(url, promise);
    return promise;
  }

  /**
   * Synchronously retrieves a previously loaded audio buffer.
   */
  getAudio(url: string): AudioBuffer | undefined {
    return this.audioBuffers.get(url);
  }
}
