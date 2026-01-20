/**
 * Utility for loading and caching game assets
 */
export class AssetLoader {
  private images: Map<string, HTMLImageElement> = new Map();

  /**
   * Loads an image from the specified URL. Returns a cached version if already loaded.
   */
  async loadImage(url: string): Promise<HTMLImageElement> {
    const cached = this.images.get(url);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(url, img);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }

  /**
   * Synchronously retrieves a previously loaded image.
   */
  getImage(url: string): HTMLImageElement | undefined {
    return this.images.get(url);
  }
}
