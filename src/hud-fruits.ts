import { FruitType } from './types.js';
import { FRUIT_DATA } from './config.js';

export function getHudFruits(level: number): FruitType[] {
  const fruits: FruitType[] = [];
  const startLevel = Math.max(1, level - 6);
  
  for (let i = startLevel; i <= level; i++) {
    const data = FRUIT_DATA[i] || FRUIT_DATA[13];
    if (data) {
      fruits.push(data.type);
    }
  }
  
  return fruits;
}
