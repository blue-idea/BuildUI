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

    const payload = selectedCall![0];
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

  it('点击超链接元素时严格阻止默认跳转，并上报包含完整盒模型 boxModel 的元素数据', () => {
    // 增加带 a 标签的 DOM 结构
    const container = document.createElement('div');
    container.innerHTML = `
      <a href="https://example.com/checkout" data-dyad-id="src/components/Link.tsx:5:2" class="nav-link" style="margin: 10px; padding: 8px; border: 2px solid black;">
        Go to Checkout
      </a>
    `;
    document.body.appendChild(container);

    const teardown = setupPreviewInspector(window);

    // 激活审查模式
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'buildui:inspect-mode', active: true },
        origin: 'http://localhost:3000',
        source: window.parent,
      })
    );

    const link = container.querySelector('a')!;
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(clickEvent);

    // 必须阻止默认跳转与冒泡
    expect(clickEvent.defaultPrevented).toBe(true);

    const calls = parentPostMessage.mock.calls;
    const selectedCall = calls.find((call) => call[0]?.type === 'buildui:element-selected');
    expect(selectedCall).toBeDefined();

    const element = selectedCall![0].element;
    expect(element.tagName).toBe('a');
    expect(element.boxModel).toBeDefined();
    expect(element.boxModel.margin).toBeDefined();
    expect(element.boxModel.border).toBeDefined();
    expect(element.boxModel.padding).toBeDefined();
    expect(element.boxModel.content).toBeDefined();

    teardown?.();
  });

  it('选中元素后在沙箱中渲染盒模型高亮框（包含 margin, border, padding, content 分色层与锁定标记）', () => {
    const teardown = setupPreviewInspector(window);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'buildui:inspect-mode', active: true },
        origin: 'http://localhost:3000',
        source: window.parent,
      })
    );

    const button = document.querySelector('button')!;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    const overlay = document.getElementById('__buildui_inspector_overlay__');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('data-locked')).toBe('true');

    // 验证盒模型分层 DOM 存在
    const marginBox = overlay?.querySelector('#__buildui_box_margin__');
    const borderBox = overlay?.querySelector('#__buildui_box_border__');
    const paddingBox = overlay?.querySelector('#__buildui_box_padding__');
    const contentBox = overlay?.querySelector('#__buildui_box_content__');

    expect(marginBox).not.toBeNull();
    expect(borderBox).not.toBeNull();
    expect(paddingBox).not.toBeNull();
    expect(contentBox).not.toBeNull();

    // 验证接收 buildui:clear-selection 时解锁
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'buildui:clear-selection' },
        origin: 'http://localhost:3000',
        source: window.parent,
      })
    );
    expect(overlay?.getAttribute('data-locked')).toBeNull();

    teardown?.();
  });

  it('监听路由变化并在 pushState / popstate / hashchange 时向父级分发 buildui:route-changed 消息', () => {
    const teardown = setupPreviewInspector(window);

    // 触发 pushState
    window.history.pushState({}, '', '/dashboard');
    expect(parentPostMessage).toHaveBeenCalled();

    const pushCall = parentPostMessage.mock.calls.find(
      (call) => call[0]?.type === 'buildui:route-changed' && call[0]?.pathname === '/dashboard'
    );
    expect(pushCall).toBeDefined();
    expect(pushCall![0].url).toContain('/dashboard');

    // 触发 popstate
    window.dispatchEvent(new PopStateEvent('popstate'));
    const popCall = parentPostMessage.mock.calls.find(
      (call) => call[0]?.type === 'buildui:route-changed'
    );
    expect(popCall).toBeDefined();

    teardown?.();
  });
});
