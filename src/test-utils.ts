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

export interface MockContext {
  fillRect: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  closePath: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
  scale: ReturnType<typeof vi.fn>;
  fillStyle: string;
  fillText: ReturnType<typeof vi.fn>;
  font: string;
  textAlign: string;
  textBaseline: string;
  canvas: {
    width: number;
    height: number;
  };
  _fillStyle: string;
  fillStyleSpy: ReturnType<typeof vi.fn>;
}

export function createMockContext(width: number, height: number): MockContext {
  const mockContext = {
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    clearRect: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    _fillStyle: '',
    get fillStyle(): string { return this._fillStyle; },
    set fillStyle(val: string) { 
      this._fillStyle = val;
      this.fillStyleSpy(val);
    },
    fillStyleSpy: vi.fn(),
    fillText: vi.fn(),
    font: '',
    textAlign: '',
    textBaseline: '',
    canvas: {
      width,
      height
    }
  };

  return mockContext as unknown as MockContext;
}

import type { IGameState } from './types.js';

export function createMockState(): IGameState {
  return {
    getEntities: vi.fn().mockReturnValue([]),
    getScore: vi.fn().mockReturnValue(0),
    getHighScore: vi.fn().mockReturnValue(0),
    getLives: vi.fn().mockReturnValue(0),
    getRemainingPellets: vi.fn().mockReturnValue(0),
    getSpawnPosition: vi.fn(),
    consumePellet: vi.fn(),
    isPelletEaten: vi.fn().mockReturnValue(false),
    updatePacman: vi.fn(),
    updateGhosts: vi.fn(),
    isGameOver: vi.fn().mockReturnValue(false),
    isWin: vi.fn().mockReturnValue(false),
    getLevel: vi.fn().mockReturnValue(1),
    isDying: vi.fn().mockReturnValue(false),
    isReady: vi.fn().mockReturnValue(false),
    getPowerUpTimer: vi.fn().mockReturnValue(0),
    getPointEffects: vi.fn().mockReturnValue([]),
    getFruit: vi.fn().mockReturnValue(null),
    startReady: vi.fn(),
  } as unknown as IGameState;
}
