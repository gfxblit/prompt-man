/**
 * Utility for loading and caching game assets
 */
export class AssetLoader {
  private images: Map<string, HTMLImageElement> = new Map();
  private pendingRequests: Map<string, Promise<HTMLImageElement>> = new Map();

  /**
   * Loads an image from the specified URL. Returns a cached version if already loaded.
   */
  async loadImage(url: string): Promise<HTMLImageElement> {
    const cached = this.images.get(url);
    if (cached) {
      return cached;
    }

    const pending = this.pendingRequests.get(url);
    if (pending) {
      return pending;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(url, img);
        this.pendingRequests.delete(url);
        resolve(img);
      };
      img.onerror = () => {
        this.pendingRequests.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });

    this.pendingRequests.set(url, promise);
    return promise;
  }

  /**
   * Synchronously retrieves a previously loaded image.
   */
  getImage(url: string): HTMLImageElement | undefined {
    return this.images.get(url);
  }
}
