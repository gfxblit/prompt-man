import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './state.js';
import { Grid } from './grid.js';
import { EntityType } from './types.js';
import { POWER_UP_DURATION, GHOST_OFFSETS, SOURCE_GHOST_SIZE, PALETTE_PADDING_X, COLORS } from './config.js';
import { Renderer } from './renderer.js';

vi.mock('./config.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./config.js')>();
  return {
    ...mod,
    READY_DURATION: 0,
    POWER_UP_FLASH_THRESHOLD: 2000,
    POWER_UP_FLASH_RATE: 200,
  };
});

describe('Issue #62: Ghost Flashing when Power Pellet runs low', () => {
  let gameState: GameState;
  let grid: Grid;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });

    const layout = `
#######
#P.G o#
#######
`.trim();
    grid = Grid.fromString(layout);
    gameState = new GameState(grid);
    // Ensure we are NOT in ready state for these tests
    gameState.updatePacman({ dx: 0, dy: 0 }, 3000);
  });

  it('provides the current power-up timer', () => {
    expect(gameState.getPowerUpTimer()).toBe(0);

    // Consume power pellet at (5, 1)
    gameState.consumePellet(5, 1);
    expect(gameState.getPowerUpTimer()).toBe(POWER_UP_DURATION);

    // Update time
    gameState.updateGhosts(1000);
    expect(gameState.getPowerUpTimer()).toBe(POWER_UP_DURATION - 1000);
  });

  it('calculates flashing state correctly in renderer', () => {
    const mockContext = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      fillRect: vi.fn(),
    };
    const mockSpritesheet = {} as HTMLImageElement;
    const renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D, mockSpritesheet);

    const ghost = gameState.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    // 1. Scared but not flashing (timer > threshold)
    gameState.consumePellet(5, 1);
    expect(gameState.getPowerUpTimer()).toBe(POWER_UP_DURATION);
    ghost.isScared = true;
    
    renderer.render(grid, gameState, 0);
    
    // Check drawImage calls. The ghost should be rendered.
    // getGhostSpriteSource(color, dir, isScared, frame, isDead, isFlashing)
    // For SCARED, sCol is 0.
    // For SCARED_FLASH, sCol is 2.
    
    const scaredX0 = GHOST_OFFSETS.SCARED.x + (0 * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;
    const scaredX1 = GHOST_OFFSETS.SCARED.x + (1 * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;
    const flashX0 = GHOST_OFFSETS.SCARED_FLASH.x + (0 * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;
    const flashX1 = GHOST_OFFSETS.SCARED_FLASH.x + (1 * SOURCE_GHOST_SIZE) + PALETTE_PADDING_X;

    const isScaredX = (x: number) => x === scaredX0 || x === scaredX1;
    const isFlashX = (x: number) => x === flashX0 || x === flashX1;

    const scaredCall = mockContext.drawImage.mock.calls.find(call => isScaredX(call[1]));
    expect(scaredCall).toBeDefined();

    mockContext.drawImage.mockClear();

    // 2. Scared and flashing (timer <= threshold)
    // Threshold is 2000. Set timer to 1500.
    gameState.updateGhosts(POWER_UP_DURATION - 1500);
    
    // Let's use 1300. 1300 / 200 = 6.5. floor = 6. 6 % 2 = 0. -> FLASHING
    gameState.updateGhosts(200);
    expect(ghost.isScared).toBe(true);

    renderer.render(grid, gameState, 0);
    
    const lastCall = mockContext.drawImage.mock.calls.find(call => isFlashX(call[1]) || isScaredX(call[1]));
    expect(lastCall).toBeDefined();
    expect(isFlashX(lastCall![1])).toBe(true); 
  });

  it('calculates flashing state correctly in primitive renderer', () => {
    const fillStyles: string[] = [];
    const mockContext = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      fillRect: vi.fn(),
      set fillStyle(val: string) {
        fillStyles.push(val);
      },
      get fillStyle() {
        return fillStyles[fillStyles.length - 1] || '';
      }
    };
    // No spritesheet
    const renderer = new Renderer(mockContext as unknown as CanvasRenderingContext2D);

    const ghost = gameState.getEntities().find(e => e.type === EntityType.Ghost)!;
    
    // 1. Scared but not flashing
    gameState.consumePellet(5, 1);
    ghost.isScared = true;
    
    renderer.render(grid, gameState, 0);
    expect(fillStyles).toContain(COLORS.SCARED_GHOST);

    // 2. Scared and flashing
    fillStyles.length = 0;
    gameState.updateGhosts(POWER_UP_DURATION - 1300);
    expect(gameState.getPowerUpTimer()).toBe(1300);

    renderer.render(grid, gameState, 0);
    expect(fillStyles).toContain('white');
  });
});
