import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from './index.js';
import { setupMockImage, setupMockAudio } from './test-utils.js';
import { AudioManager } from './audio-manager.js';

describe('Audio Unlock', () => {
  let container: HTMLElement;
  let eventListeners: { [type: string]: (() => Promise<void> | void)[] } = {};

  const GAME_START_EVENTS = ['keydown', 'mousedown', 'touchstart', 'pointerdown'];
  const AUDIO_UNLOCK_EVENTS = ['click', 'touchend', 'touchmove', 'pointerup', 'pointermove'];
  const ALL_EVENTS = [...GAME_START_EVENTS, ...AUDIO_UNLOCK_EVENTS];

  beforeEach(() => {
    eventListeners = {};
    vi.stubGlobal('window', {
      addEventListener: vi.fn((type: string, listener: () => Promise<void> | void) => {
        if (!eventListeners[type]) eventListeners[type] = [];
        eventListeners[type].push(listener);
      }),
      removeEventListener: vi.fn((type: string, listener: () => Promise<void> | void) => {
        if (eventListeners[type]) {
          eventListeners[type] = eventListeners[type].filter(l => l !== listener);
        }
      }),
      document: {
        createElement: vi.fn((tagName: string) => {
          if (tagName === 'canvas') {
            return {
              classList: { add: vi.fn() },
              appendChild: vi.fn(),
              getContext: vi.fn(() => ({
                clearRect: vi.fn(),
                fillRect: vi.fn(),
                drawImage: vi.fn(),
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                save: vi.fn(),
                restore: vi.fn(),
                translate: vi.fn(),
                scale: vi.fn(),
                fillText: vi.fn(),
              })),
              width: 100,
              height: 100,
            };
          }
          return {
            id: '',
            classList: { add: vi.fn() },
            appendChild: vi.fn(),
            innerText: '',
          };
        }),
      },
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      requestAnimationFrame: vi.fn(),
      performance: { now: vi.fn(() => 0) },
    });

    const windowMock = (window as unknown) as { document: Document, localStorage: Storage, requestAnimationFrame: (callback: FrameRequestCallback) => number, performance: Performance };
    vi.stubGlobal('document', windowMock.document);
    vi.stubGlobal('localStorage', windowMock.localStorage);
    vi.stubGlobal('requestAnimationFrame', windowMock.requestAnimationFrame);
    vi.stubGlobal('performance', windowMock.performance);

    container = {
      appendChild: vi.fn(),
      classList: { add: vi.fn() },
    } as unknown as HTMLElement;

    setupMockImage();
    setupMockAudio();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should register multiple event listeners for audio unlocking', async () => {
    await init(container);

    ALL_EVENTS.forEach(event => {
      expect(window.addEventListener).toHaveBeenCalledWith(event, expect.any(Function));
    });
  });

  it('should resume audio and start game on first interaction', async () => {
    // Mock AudioManager.prototype methods
    const resumeSpy = vi.spyOn(AudioManager.prototype, 'resumeIfNeeded').mockResolvedValue();
    const playIntroSpy = vi.spyOn(AudioManager.prototype, 'playIntroMusic').mockImplementation(() => {});
    const getStateSpy = vi.spyOn(AudioManager.prototype, 'getState').mockReturnValue('suspended');

    await init(container);

    // Get the registered listener for 'keydown' (one of the GAME_START_EVENTS)
    const keydownCalls = vi.mocked(window.addEventListener).mock.calls.filter(call => call[0] === 'keydown');
    // The last 'keydown' listener should be 'resumeAudio' (the one from init)
    const listener = keydownCalls.find(call => (call[1] as { name: string }).name === 'resumeAudio')?.[1] as (() => Promise<void>);
    
    // Simulate first interaction
    if (listener) await listener();

    expect(resumeSpy).toHaveBeenCalled();
    expect(playIntroSpy).toHaveBeenCalled();
    
    // Check that 'start' listeners are removed
    GAME_START_EVENTS.forEach(event => {
      expect(window.removeEventListener).toHaveBeenCalledWith(event, listener);
    });

    // Audio is still suspended, so 'unlock' listeners should NOT be removed yet
    AUDIO_UNLOCK_EVENTS.forEach(event => {
      expect(window.removeEventListener).not.toHaveBeenCalledWith(event, listener);
    });

    // Simulate second interaction (touchend) that successfully resumes audio
    getStateSpy.mockReturnValue('running');
    const touchendCalls = vi.mocked(window.addEventListener).mock.calls.filter(call => call[0] === 'touchend');
    const touchendListener = touchendCalls.find(call => (call[1] as { name: string }).name === 'resumeAudio')?.[1] as (() => Promise<void>);
    if (touchendListener) await touchendListener();

    AUDIO_UNLOCK_EVENTS.forEach(event => {
      expect(window.removeEventListener).toHaveBeenCalledWith(event, listener);
    });
  });

  it('should remove all listeners if first interaction resumes audio successfully', async () => {
    vi.spyOn(AudioManager.prototype, 'resumeIfNeeded').mockResolvedValue();
    vi.spyOn(AudioManager.prototype, 'playIntroMusic').mockImplementation(() => {});
    vi.spyOn(AudioManager.prototype, 'getState').mockReturnValue('running');

    await init(container);

    const listener = eventListeners['keydown']![0];
    if (listener) await listener();

    ALL_EVENTS.forEach(event => {
      expect(window.removeEventListener).toHaveBeenCalledWith(event, listener);
    });
  });
});
