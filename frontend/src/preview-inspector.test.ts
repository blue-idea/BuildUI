import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupPreviewInspector } from './preview-inspector';

describe('preview-inspector (TDD)', () => {
  let parentPostMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="root">
        <header data-dyad-id="src/components/Header.tsx:10:2" class="p-4 bg-slate-100">
          <button data-dyad-id="src/components/Header.tsx:12:4" class="px-4 py-2 bg-blue-600 text-white rounded">
            Click Me
          </button>
        </header>
      </div>
    `;

    parentPostMessage = vi.fn();
    // 模拟 window.parent
    Object.defineProperty(window, 'parent', {
      value: {
        postMessage: parentPostMessage,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('激活检查模式时设置光标，悬停时显示高亮浮层及标签徽章', () => {
    const teardown = setupPreviewInspector(window);

    // 发送激活消息
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'buildui:inspect-mode', active: true },
        origin: 'http://localhost:3000',
        source: window.parent,
      })
    );

    expect(document.documentElement.style.cursor).toBe('crosshair');

    const button = document.querySelector('button')!;
    // 模拟鼠标悬停
    button.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 50,
        clientY: 50,
      })
    );

    const overlay = document.getElementById('__buildui_inspector_overlay__');
    expect(overlay).not.toBeNull();
    expect(overlay?.style.display).not.toBe('none');
    expect(overlay?.textContent).toContain('button');
    expect(overlay?.textContent).toContain('src/components/Header.tsx:12');

    teardown?.();
  });

  it('点击元素时拦截默认行为并向父级发送 buildui:element-selected 完整元数据', () => {
    const teardown = setupPreviewInspector(window);

    // 激活审查模式
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'buildui:inspect-mode', active: true },
        origin: 'http://localhost:3000',
        source: window.parent,
      })
    );

    const button = document.querySelector('button')!;
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(parentPostMessage).toHaveBeenCalled();

    // 检查发送的消息结构
    const calls = parentPostMessage.mock.calls;
    const selectedCall = calls.find((call) => call[0]?.type === 'buildui:element-selected');
    expect(selectedCall).toBeDefined();

    const payload = selectedCall[0];
    expect(payload.element).toMatchObject({
      tagName: 'button',
      componentPath: 'src/components/Header.tsx',
      line: 12,
      column: 4,
      className: 'px-4 py-2 bg-blue-600 text-white rounded',
      textSnippet: 'Click Me',
    });

    teardown?.();
  });

  it('关闭审查模式时移除高亮并恢复光标', () => {
    const teardown = setupPreviewInspector(window);

    // 先激活
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'buildui:inspect-mode', active: true },
        origin: 'http://localhost:3000',
        source: window.parent,
      })
    );

    expect(document.documentElement.style.cursor).toBe('crosshair');

    // 再关闭
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'buildui:inspect-mode', active: false },
        origin: 'http://localhost:3000',
        source: window.parent,
      })
    );

    expect(document.documentElement.style.cursor).toBe('');
    const overlay = document.getElementById('__buildui_inspector_overlay__');
    expect(overlay?.style.display).toBe('none');

    teardown?.();
  });
});
