import { vi, type Mock } from 'vitest';

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

export class MockAudio {
  _src: string = '';
  oncanplaythrough: (() => void) | null = null;
  onerror: (() => void) | null = null;
  static instances: MockAudio[] = [];
  static shouldFail: boolean = false;

  constructor() {
    MockAudio.instances.push(this);
  }

  set src(value: string) {
    this._src = value;
    // Use a small delay to simulate async loading
    setTimeout(() => {
      if (MockAudio.shouldFail) {
        if (this.onerror) this.onerror();
      } else {
        if (this.oncanplaythrough) this.oncanplaythrough();
      }
    }, 0);
  }

  get src() {
    return this._src;
  }

  play: Mock<() => Promise<void>> = vi.fn().mockResolvedValue(undefined);
  cloneNode: Mock<(deep?: boolean) => Node> = vi.fn().mockImplementation(() => {
    const clone = new MockAudio();
    clone.src = this.src;
    return clone as unknown as Node;
  });
}

export function setupMockImage() {
  MockImage.instances = [];
  vi.stubGlobal('Image', MockImage);
  return MockImage.instances;
}

export function setupMockAudio() {
  MockAudio.instances = [];
  vi.stubGlobal('Audio', MockAudio);
  return MockAudio.instances;
}

export function mockAudioContext() {
  const mockBuffer = {
    duration: 1,
    length: 44100,
    numberOfChannels: 2,
    sampleRate: 44100,
    getChannelData: vi.fn(),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  } as unknown as AudioBuffer;

  const mockSource = {
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
    onended: null,
  } as unknown as AudioBufferSourceNode;

  const context = {
    state: 'suspended',
    resume: vi.fn().mockResolvedValue(undefined),
    decodeAudioData: vi.fn().mockResolvedValue(mockBuffer),
    createBufferSource: vi.fn().mockReturnValue(mockSource),
    destination: {} as AudioDestinationNode,
  } as unknown as AudioContext;

  return { context, mockBuffer, mockSource };
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
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(16 * 16 * 4)
    }),
    putImageData: vi.fn(),
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
