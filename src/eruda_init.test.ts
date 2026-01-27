import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Eruda Integration', () => {
  it('should load eruda unconditionally', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    expect(html).toContain('<script src="https://cdn.jsdelivr.net/npm/eruda"></script>');
  });

  it('should initialize eruda with correct settings in index.html', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
    expect(html).toContain('eruda.init');
    expect(html).toContain('container: document.body');
    expect(html).toContain("tool: ['console', 'elements', 'network', 'resources', 'info', 'snippets', 'sources']");
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
