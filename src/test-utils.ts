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

export function mock2dContext(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    canvas: {
      width: 800,
      height: 600,
    } as HTMLCanvasElement,
    get fillStyle() { return 'black'; },
    set fillStyle(value: string) { /* do nothing */ },
    get font() { return '10px sans-serif'; },
    set font(value: string) { /* do nothing */ },
    get textAlign() { return 'start'; },
    set textAlign(value: CanvasTextAlign) { /* do nothing */ },
    get textBaseline() { return 'alphabetic'; },
    set textBaseline(value: CanvasTextBaseline) { /* do nothing */ },
    get strokeStyle() { return 'black'; },
    set strokeStyle(value: string) { /* do nothing */ },
    get lineWidth() { return 1; },
    set lineWidth(value: number) { /* do nothing */ },
  } as unknown as CanvasRenderingContext2D;
}
