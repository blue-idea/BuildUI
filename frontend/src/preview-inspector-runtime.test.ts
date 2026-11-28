import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const inspectorScript = readFileSync(resolve('../internal/scaffold/template/src/preview-inspector.js'), 'utf8');

describe('运行时预览脚本的锁定选区', () => {
  let frame: HTMLIFrameElement;
  let preview: Window & typeof globalThis;
  let container: HTMLElement;
  let target: HTMLButtonElement;

  function sendMessage(data: Record<string, unknown>) {
    preview.dispatchEvent(new preview.MessageEvent('message', {
      data,
      origin: window.location.origin,
      source: preview.parent,
    }));
  }

  beforeEach(() => {
    frame = document.createElement('iframe');
    document.body.append(frame);
    preview = frame.contentWindow as Window & typeof globalThis;
    preview.document.body.innerHTML = '<main><button>Suggest Dinner</button></main>';
    container = preview.document.querySelector('main')!;
    target = preview.document.querySelector('button')!;
    new Function('window', 'Element', inspectorScript)(preview, preview.Element);
    sendMessage({ type: 'buildui:inspect-mode', active: true });
  });

  afterEach(() => {
    frame.remove();
    vi.restoreAllMocks();
  });

  // v19.REQ-003 / AC-003-2：锁定框始终与目标元素的可见位置对齐。
  it.each(['document', 'container'])('滚动 %s 时重新定位锁定框，清除选区后保持隐藏', async (scrollTarget) => {
    const getRect = vi.spyOn(target, 'getBoundingClientRect');
    getRect.mockReturnValue(new preview.DOMRect(40, 320, 160, 48));
    target.dispatchEvent(new preview.MouseEvent('click', { bubbles: true, cancelable: true }));

    const overlay = preview.document.getElementById('__buildui_inspector_overlay__')!;
    expect(overlay.style.top).toBe('320px');
    const scroller = scrollTarget === 'document' ? preview.document : container;
    getRect.mockReturnValue(new preview.DOMRect(24, 200, 160, 48));
    scroller.dispatchEvent(new preview.Event('scroll'));
    await new Promise((resolve) => preview.requestAnimationFrame(resolve));
    expect(overlay.style.top).toBe('200px');
    expect(overlay.style.left).toBe('24px');

    sendMessage({ type: 'buildui:clear-selection' });
    scroller.dispatchEvent(new preview.Event('scroll'));
    await new Promise((resolve) => preview.requestAnimationFrame(resolve));
    expect(overlay.style.display).toBe('none');
  });
});
