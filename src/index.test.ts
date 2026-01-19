import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init, levelTemplate } from './index.js';

describe('Game Initialization', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'output';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should render the level template to the output element', () => {
    const grid = init(container);
    
    expect(container.textContent).toContain(levelTemplate);
    expect(grid).toBeDefined();
    expect(grid.getWidth()).toBeGreaterThan(0);
  });
  
  it('should handle missing output element gracefully', () => {
    const grid = init(null);
    expect(grid).toBeDefined();
  });
});