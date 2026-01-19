import { describe, it, expect, vi } from 'vitest';

describe('main', () => {
  it('should call init when imported if container exists', async () => {
    const { initMock } = vi.hoisted(() => ({
      initMock: vi.fn(),
    }));

    vi.mock('./index.js', () => ({
      init: initMock,
    }));

    const container = {} as HTMLElement;
    vi.stubGlobal('document', {
      getElementById: vi.fn((id) => (id === 'game-container' ? container : null)),
    });

    // We use dynamic import to trigger the module execution
    await import('./main.js');

    expect(initMock).toHaveBeenCalledWith(container);
  });
});
