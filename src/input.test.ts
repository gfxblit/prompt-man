import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputHandler } from './input.js';

describe('InputHandler', () => {
  let handler: InputHandler;

  beforeEach(() => {
    handler = new InputHandler();
  });

  afterEach(() => {
    handler.dispose();
  });

  it('should initialize with no direction', () => {
    expect(handler.getDirection()).toEqual({ dx: 0, dy: 0 });
  });

  it('should update direction on ArrowUp', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: -1 });
  });

  it('should update direction on ArrowDown', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: 1 });
  });

  it('should update direction on ArrowLeft', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(handler.getDirection()).toEqual({ dx: -1, dy: 0 });
  });

  it('should update direction on ArrowRight', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(handler.getDirection()).toEqual({ dx: 1, dy: 0 });
  });

  it('should update direction on WASD keys', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: -1 });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: 1 });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(handler.getDirection()).toEqual({ dx: -1, dy: 0 });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(handler.getDirection()).toEqual({ dx: 1, dy: 0 });
  });

  it('should ignore non-directional keys', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(handler.getDirection()).toEqual({ dx: 0, dy: 0 });
  });
});
