import { init } from './index.js';

if (typeof document !== 'undefined') {
  const container = document.getElementById('game-container');
  if (container) {
    init(container);
  }
}
