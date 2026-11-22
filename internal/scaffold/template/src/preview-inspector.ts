/**
 * Blot-UI 预览沙箱审查模式脚本
 * 支持元素自由悬停指示框、标签提示徽章、点击锁定与完整元数据 postMessage 通信
 */

export function setupPreviewInspector(win: Window = window) {
  if (typeof win === 'undefined' || !win.document) return () => {};

  let parentOrigin = '';
  const doc = win.document;

  // 创建或获取高亮 Overlay 容器
  let overlay = doc.getElementById('__buildui_inspector_overlay__');
  if (!overlay) {
    overlay = doc.createElement('div');
    overlay.id = '__buildui_inspector_overlay__';
    overlay.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483647;display:none;border:2px solid #3b82f6;background:rgba(59,130,246,0.12);border-radius:4px;box-sizing:border-box;transition:top 0.05s ease,left 0.05s ease,width 0.05s ease,height 0.05s ease;';

    const badge = doc.createElement('div');
    badge.id = '__buildui_inspector_badge__';
    badge.style.cssText =
      'position:absolute;top:-24px;left:0;background:#1e3a8a;color:#ffffff;font-size:11px;font-family:monospace;padding:2px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);pointer-events:none;';
    overlay.appendChild(badge);
    doc.body.appendChild(overlay);
  }

  const badge = doc.getElementById('__buildui_inspector_badge__') || overlay.firstElementChild;

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type !== 'buildui:inspect-mode') return;
    parentOrigin = event.data.active ? event.origin : '';
    doc.documentElement.style.cursor = parentOrigin ? 'crosshair' : '';
    if (!parentOrigin && overlay) {
      overlay.style.display = 'none';
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!parentOrigin || !(event.target instanceof Element)) return;
    const target = event.target;
    if (target.id === '__buildui_inspector_overlay__' || target.closest('#__buildui_inspector_overlay__')) {
      return;
    }

    const dyadEl = target.closest('[data-dyad-id]');
    const inspectTarget = dyadEl || target;
    const rect = inspectTarget.getBoundingClientRect();

    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
    }

    if (badge) {
      const tagName = target.tagName.toLowerCase();
      const source = dyadEl?.getAttribute('data-dyad-id') || '';
      badge.textContent = `<${tagName}> ${source ? source.replace(/:\d+$/, '') : ''}`;

      // 若靠近窗口顶部，将徽章向下翻转
      if (rect.top < 26) {
        (badge as HTMLElement).style.top = 'calc(100% + 4px)';
      } else {
        (badge as HTMLElement).style.top = '-24px';
      }
    }
  };

  const handleClick = (event: MouseEvent) => {
    if (!parentOrigin || !(event.target instanceof Element)) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const target = event.target;
    const dyadEl = target.closest('[data-dyad-id]');
    const source = dyadEl?.getAttribute('data-dyad-id') || '';

    const match = source.match(/^(.*?):(\d+):(\d+)$/);
    const componentPath = match ? match[1].replace(/\\/g, '/') : source.replace(/\\/g, '/');
    const line = match ? parseInt(match[2], 10) : undefined;
    const column = match ? parseInt(match[3], 10) : undefined;

    const className =
      (typeof target.className === 'string' ? target.className : target.getAttribute('class')) || '';
    const textSnippet = (target.textContent || '').trim().slice(0, 80);
    const rect = (dyadEl || target).getBoundingClientRect();

    const inspectedElement = {
      id: `el-${Date.now()}`,
      tagName: target.tagName.toLowerCase(),
      componentPath,
      line,
      column,
      className,
      textSnippet,
      boundingBox: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
    };

    // 向上发送完整选定元素信息
    win.parent.postMessage(
      {
        type: 'buildui:element-selected',
        element: inspectedElement,
      },
      parentOrigin
    );

    // 兼容原有的简易 source-selected 监听
    win.parent.postMessage(
      {
        type: 'buildui:source-selected',
        path: componentPath,
      },
      parentOrigin
    );
  };

  win.addEventListener('message', handleMessage);
  win.addEventListener('mousemove', handleMouseMove, { passive: true });
  win.addEventListener('click', handleClick, true);

  return () => {
    win.removeEventListener('message', handleMessage);
    win.removeEventListener('mousemove', handleMouseMove);
    win.removeEventListener('click', handleClick, true);
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    doc.documentElement.style.cursor = '';
  };
}

// 在 iframe 环境中自启动
if (typeof window !== 'undefined' && window.parent !== window) {
  setupPreviewInspector(window);
}

export default setupPreviewInspector;
