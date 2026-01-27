import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from './index.js';

vi.mock('./index.js', () => ({
  init: vi.fn().mockResolvedValue(undefined),
}));

describe('main entry point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call init if #game-container exists', async () => {
    const mockContainer = { appendChild: vi.fn() } as unknown as HTMLElement;
    const getElementByIdSpy = vi.spyOn(document, 'getElementById').mockImplementation((id) => (id === 'game-container' ? mockContainer : null));

    // Import main to trigger side effect
    await import('./main.js?test=' + Date.now());

    expect(document.getElementById).toHaveBeenCalledWith('game-container');
    expect(init).toHaveBeenCalledWith(mockContainer);
    
    getElementByIdSpy.mockRestore();
  });

  it('should not call init if #game-container does not exist', async () => {
    const getElementByIdSpy = vi.spyOn(document, 'getElementById').mockImplementation(() => null);

    // Import main to trigger side effect
    await import('./main.js?test2=' + Date.now());

    expect(init).not.toHaveBeenCalled();
    
    getElementByIdSpy.mockRestore();
  });
});