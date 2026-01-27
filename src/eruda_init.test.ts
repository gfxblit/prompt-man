import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Eruda Integration', () => {
  it('should only load eruda if eruda=true is in URL', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    expect(html).toContain("new URLSearchParams(window.location.search).get('eruda') === 'true'");
  });

  it('should have eruda CDN script in index.html', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    expect(html).toContain('https://cdn.jsdelivr.net/npm/eruda');
  });

  it('should initialize eruda with correct settings in index.html', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    expect(html).toContain('eruda.init');
    expect(html).toContain('useShadowDom: true');
    expect(html).toContain('autoScale: true');
    expect(html).toContain("theme: 'Dark'");
  });

  it('should position eruda button in top-right', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    expect(html).toContain('eruda.position');
    expect(html).toContain('window.innerWidth - 60');
    expect(html).toContain('y: 10');
  });
});
