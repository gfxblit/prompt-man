# Architecture Review & Roadmap

## 1. Executive Summary

The current "Prompt Man" codebase is a functional Pac-Man clone built with TypeScript and Vite. While the codebase is relatively small and easy to navigate, it exhibits signs of architectural debt that could hinder future scalability and maintainability. Specifically, the flat file structure, the "God Object" anti-pattern in state management, and tight coupling between components are areas of concern.

This document outlines a plan to transition the codebase to a **Modular Monolith** architecture, improving separation of concerns and making the system more robust and testable.

## 2. Current Architecture Assessment

### 2.1. Structure
All source files are located in the root of `src/`. This "flat" structure is simple but scales poorly. Mixing domain logic, rendering code, input handling, and utilities makes it difficult to understand component boundaries.

### 2.2. Key Components
- **Game State (`state.ts`)**: A monolithic class (`GameState`) that handles:
  - Entity management (Pacman, Ghosts)
  - Collision detection
  - Scoring and High Scores
  - Level progression
  - Movement logic
  - Sound triggers
- **Entities (`types.ts`)**: The `Entity` interface is a union of all possible entity properties. Pacman and Ghosts share the same data structure, leading to optional properties (`isScared`, `deathTimer`) that are only relevant to specific types.
- **Rendering (`renderer.ts`)**: Tightly coupled to the Canvas API.
- **AI (`ghost-ai.ts`)**: Functional and stateless, which is good, but integration is manual within `GameState`.

### 2.3. Identified Issues
- **God Object**: `GameState` is doing too much. Adding new features (e.g., multiplayer, new items) requires modifying this single large file.
- **Tight Coupling**: `GameState` knows too much about how ghosts move and how scoring works.
- **Type Safety**: The loose `Entity` interface reduces type safety.

## 3. Proposed Architecture

We propose a **Modular Architecture** grouped by domain/functionality.

### 3.1. Directory Structure

```
src/
├── core/           # Entry point, Game Loop, Event Bus
├── entities/       # Entity classes (Pacman, Ghost)
├── systems/        # Game logic systems (Movement, Collision, AI)
├── rendering/      # Rendering logic, Sprites
├── input/          # Input handling
├── audio/          # Audio management
├── utils/          # Shared utilities (Grid, Math, Assets)
└── constants/      # Configuration and Constants
```

### 3.2. Architectural Patterns

- **Entity-Component System (Lite)**: While a full ECS might be overkill, separating **Data** (Entities) from **Logic** (Systems) is beneficial.
  - **Entities**: Simple classes/objects holding state (e.g., `Ghost` class).
  - **Systems**: Managers that operate on entities (e.g., `MovementSystem`, `CollisionSystem`).
- **Manager Pattern**: Break `GameState` into:
  - `EntityManager`: Adds/removes/queries entities.
  - `ScoreManager`: Handles scoring logic.
  - `LevelManager`: Handles game flow.

## 4. Roadmap

### Phase 1: Structural Reorganization (Immediate)
- Goal: Organize files into logical folders without changing code logic.
- Benefit: Immediate improvement in code navigability.

### Phase 2: Entity Refactoring
- Goal: Replace the generic `Entity` interface with a base `Entity` class and specific `Pacman` and `Ghost` subclasses.
- Benefit: Better type safety, encapsulation of entity-specific logic (e.g., `ghost.isScared` only on Ghost).

### Phase 3: State Decomposition
- Goal: Break `GameState` into smaller, focused managers.
- Benefit: Easier testing, easier feature addition.

### Phase 4: System Extraction
- Goal: Extract physics and collision logic into dedicated systems.
- Benefit: Reusable logic, easier to test complex interactions.

## 5. Conventions
- **Imports**: Use explicit relative imports.
- **Testing**: Test files sit next to the source files they test.
- **Naming**: PascalCase for Classes/Components, camelCase for instances/functions.
