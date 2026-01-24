# Prompt Man

A modern, vibe-coding implementation of the classic Pac-Man game, built with TypeScript and HTML5 Canvas.

## Overview

**Prompt Man** is a fully interactive Pac-Man clone that aims to replicate the classic arcade experience while using modern web technologies. It features ghost AI, state management, responsive design, and smooth animations.

## Features

- **Classic Gameplay**: Navigate the maze, eat pellets, and avoid ghosts.
- **Ghost AI**: Implements distinct ghost behaviors including Chase, Scatter (frightened), and Return-to-Base (dead).
- **Power Pellets**: Turn the tables on ghosts by eating power pellets.
- **Scoring System**: Tracks current score and persists high score using LocalStorage.
- **Responsive Controls**:
  - **Desktop**: Keyboard support (Arrow keys or WASD).
  - **Mobile**: Touch controls with a virtual joystick.
- **Responsive Design**: The game canvas scales to fit different screen sizes.

## How to Play

### Objective
Eat all the pellets in the maze to advance. Avoid the ghosts!

### Controls

| Platform | Action | Controls |
|----------|--------|----------|
| **Desktop** | Move | `Arrow Keys` or `W` `A` `S` `D` |
| **Mobile** | Move | Touch and drag anywhere on the screen (Virtual Joystick) |

## Tech Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Rendering**: HTML5 Canvas API (2D Context)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd prompt-man
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start the development server with hot-reload:
```bash
pnpm dev
```

### Building

Build the project for production:
```bash
pnpm build
```
The output will be in the `dist/` directory.

### Running Production Build

Preview the built application:
```bash
pnpm start
```

### Testing

Run the test suite:
```bash
pnpm test
```

Lint the codebase:
```bash
pnpm lint
```

## Project Structure

- `src/`
  - `main.ts`: Application entry point.
  - `index.ts`: Game initialization logic.
  - `state.ts`: Manages game state (entities, score, collisions, lives).
  - `renderer.ts`: Handles all Canvas rendering.
  - `input.ts`: Handles keyboard and touch input.
  - `ghost-ai.ts`: Implements ghost pathfinding and behavior.
  - `grid.ts`: Level grid data structure and collision logic.
  - `config.ts`: Game constants and configuration.
  - `types.ts`: TypeScript type definitions.
  - `assets.ts`: Asset loading utilities.

## License

ISC License. See `package.json` for details.
