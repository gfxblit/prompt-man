import { init } from './index.js';
import eruda from 'eruda';

eruda.init();

if (typeof document !== 'undefined') {
  const container = document.getElementById('game-container');
  if (container) {
    init(container).catch(err => {
      console.error('Game initialization failed:', err);
    });
  }
}
