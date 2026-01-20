import { vi } from 'vitest';

export class MockImage {
  _src: string = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  static instances: MockImage[] = [];
  static shouldFail: boolean = false;

  constructor() {
    MockImage.instances.push(this);
  }

  set src(value: string) {
    this._src = value;
    // Use a small delay to simulate async loading
    setTimeout(() => {
      if (MockImage.shouldFail) {
        if (this.onerror) this.onerror();
      } else {
        if (this.onload) this.onload();
      }
    }, 0);
  }

  get src() {
    return this._src;
  }
}

export function setupMockImage() {
  MockImage.instances = [];
  vi.stubGlobal('Image', MockImage);
  return MockImage.instances;
}
