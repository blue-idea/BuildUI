/**
 * Blot-UI 预览沙箱审查模式脚本
 * 支持元素仿浏览器 DevTools 悬停指示框、防跳转事件拦截、选中盒模型框（Margin/Border/Padding/Content）与 postMessage 通信
 */

export interface BoxModelSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BoxModelMetrics {
  margin: BoxModelSides;
  border: BoxModelSides;
  padding: BoxModelSides;
  content: { width: number; height: number };
  rect: { top: number; left: number; width: number; height: number; x: number; y: number };
}

/**
 * 计算 DOM 元素的完整盒模型参数 (Margin, Border, Padding, Content)
 */
export function getBoxModelMetrics(el: Element, win: Window): BoxModelMetrics {
  const rect = el.getBoundingClientRect();
  const style = win.getComputedStyle(el);
  const parsePx = (val: string | null | undefined): number => {
    if (!val) return 0;
    const n = parseFloat(val);
    return isNaN(n) ? 0 : Math.round(n * 10) / 10;
  };

  const margin: BoxModelSides = {
    top: parsePx(style.marginTop),
    right: parsePx(style.marginRight),
    bottom: parsePx(style.marginBottom),
    left: parsePx(style.marginLeft),
  };

  const border: BoxModelSides = {
    top: parsePx(style.borderTopWidth),
    right: parsePx(style.borderRightWidth),
    bottom: parsePx(style.borderBottomWidth),
    left: parsePx(style.borderLeftWidth),
  };

  const padding: BoxModelSides = {
    top: parsePx(style.paddingTop),
    right: parsePx(style.paddingRight),
    bottom: parsePx(style.paddingBottom),
    left: parsePx(style.paddingLeft),
  };

  const contentWidth = Math.max(
    0,
    Math.round((rect.width - border.left - border.right - padding.left - padding.right) * 10) / 10
  );
  const contentHeight = Math.max(
    0,
    Math.round((rect.height - border.top - border.bottom - padding.top - padding.bottom) * 10) / 10
  );

  return {
    margin,
    border,
    padding,
    content: {
      width: contentWidth,
      height: contentHeight,
    },
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y,
    },
  };
}

export function setupPreviewInspector(win: Window = window) {
  if (typeof win === 'undefined' || !win.document) return () => {};

  let parentOrigin = '';
  let isLocked = false;
  const doc = win.document;

  // 创建或获取仿 DevTools 盒模型 Overlay 容器
  let overlay = doc.getElementById('__buildui_inspector_overlay__');
  if (!overlay) {
    overlay = doc.createElement('div');
    overlay.id = '__buildui_inspector_overlay__';
    overlay.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483647;display:none;box-sizing:border-box;transition:all 0.05s ease;';

    // 1. Margin 外边距层 (浅橙色)
    const marginBox = doc.createElement('div');
    marginBox.id = '__buildui_box_margin__';
    marginBox.style.cssText =
      'position:absolute;inset:0;pointer-events:none;box-sizing:border-box;background:rgba(249,152,73,0.28);border:1px dashed rgba(249,152,73,0.85);border-radius:2px;';

    // 2. Border 边框层 (浅黄色)
    const borderBox = doc.createElement('div');
    borderBox.id = '__buildui_box_border__';
    borderBox.style.cssText =
      'position:absolute;pointer-events:none;box-sizing:border-box;background:rgba(254,216,118,0.35);border:1px solid rgba(234,179,8,0.9);';

    // 3. Padding 内边距层 (浅绿色)
    const paddingBox = doc.createElement('div');
    paddingBox.id = '__buildui_box_padding__';
    paddingBox.style.cssText =
      'position:absolute;pointer-events:none;box-sizing:border-box;background:rgba(149,213,139,0.35);';

    // 4. Content 内容层 (浅蓝色)
    const contentBox = doc.createElement('div');
    contentBox.id = '__buildui_box_content__';
    contentBox.style.cssText =
      'position:absolute;pointer-events:none;box-sizing:border-box;background:rgba(59,130,246,0.3);border:1px solid rgba(59,130,246,0.8);';

    // 浮动信息 Badge
    const badge = doc.createElement('div');
    badge.id = '__buildui_inspector_badge__';
    badge.style.cssText =
      'position:absolute;top:-28px;left:0;background:#0f172a;color:#ffffff;font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:3px 8px;border-radius:6px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:none;display:flex;items-center;gap:6px;border:1px solid rgba(255,255,255,0.15);';

    overlay.appendChild(marginBox);
    overlay.appendChild(borderBox);
    overlay.appendChild(paddingBox);
    overlay.appendChild(contentBox);
    overlay.appendChild(badge);
    doc.body.appendChild(overlay);
  }

  const borderBox = doc.getElementById('__buildui_box_border__');
  const paddingBox = doc.getElementById('__buildui_box_padding__');
  const contentBox = doc.getElementById('__buildui_box_content__');
  const badge = doc.getElementById('__buildui_inspector_badge__');

  const updateOverlayGeometry = (targetEl: Element, locked = false) => {
    if (!overlay) return;
    const boxModel = getBoxModelMetrics(targetEl, win);
    const { margin, border, padding, content, rect } = boxModel;

    // 总容器覆盖 Margin 外边界
    const overlayTop = rect.top - margin.top;
    const overlayLeft = rect.left - margin.left;
    const overlayWidth = rect.width + margin.left + margin.right;
    const overlayHeight = rect.height + margin.top + margin.bottom;

    overlay.style.display = 'block';
    overlay.style.top = `${overlayTop}px`;
    overlay.style.left = `${overlayLeft}px`;
    overlay.style.width = `${overlayWidth}px`;
    overlay.style.height = `${overlayHeight}px`;

    // BorderBox 相对位置
    if (borderBox) {
      borderBox.style.top = `${margin.top}px`;
      borderBox.style.left = `${margin.left}px`;
      borderBox.style.width = `${rect.width}px`;
      borderBox.style.height = `${rect.height}px`;
    }

    // PaddingBox 相对位置
    if (paddingBox) {
      paddingBox.style.top = `${margin.top + border.top}px`;
      paddingBox.style.left = `${margin.left + border.left}px`;
      paddingBox.style.width = `${rect.width - border.left - border.right}px`;
      paddingBox.style.height = `${rect.height - border.top - border.bottom}px`;
    }

    // ContentBox 相对位置
    if (contentBox) {
      contentBox.style.top = `${margin.top + border.top + padding.top}px`;
      contentBox.style.left = `${margin.left + border.left + padding.left}px`;
      contentBox.style.width = `${content.width}px`;
      contentBox.style.height = `${content.height}px`;
    }

    if (badge) {
      const tagName = targetEl.tagName.toLowerCase();
      const dyadEl = targetEl.closest('[data-dyad-id]');
      const source = dyadEl?.getAttribute('data-dyad-id') || '';
      const sizeLabel = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      const prefix = locked ? '🎯 [Selected] ' : '';
      const sourcePart = source ? ` (${source.replace(/:\d+$/, '')})` : '';

      badge.textContent = `${prefix}<${tagName}> ${sizeLabel}${sourcePart}`;

      if (overlayTop < 32) {
        badge.style.top = 'calc(100% + 4px)';
      } else {
        badge.style.top = '-28px';
      }
    }

    if (locked) {
      overlay.setAttribute('data-locked', 'true');
    } else {
      overlay.removeAttribute('data-locked');
    }
  };

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'buildui:clear-selection') {
      isLocked = false;
      if (overlay) {
        overlay.removeAttribute('data-locked');
      }
      return;
    }

    if (event.data?.type !== 'buildui:inspect-mode') return;
    parentOrigin = event.data.active ? event.origin : '';
    doc.documentElement.style.cursor = parentOrigin ? 'crosshair' : '';
    if (!parentOrigin) {
      isLocked = false;
      if (overlay) {
        overlay.style.display = 'none';
        overlay.removeAttribute('data-locked');
      }
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!parentOrigin || isLocked || !(event.target instanceof Element)) return;
    const target = event.target;
    if (target.id === '__buildui_inspector_overlay__' || target.closest('#__buildui_inspector_overlay__')) {
      return;
    }

    const dyadEl = target.closest('[data-dyad-id]');
    const inspectTarget = dyadEl || target;
    updateOverlayGeometry(inspectTarget, false);
  };

  const handleClick = (event: MouseEvent) => {
    if (!parentOrigin || !(event.target instanceof Element)) return;

    // 绝对阻止所有默认点击与冒泡行为（如链接跳转、表单提交）
    event.preventDefault();
    event.stopPropagation();
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

    const inspectTarget = dyadEl || target;
    const boxModel = getBoxModelMetrics(inspectTarget, win);

    const inspectedElement = {
      id: `el-${Date.now()}`,
      tagName: target.tagName.toLowerCase(),
      componentPath,
      line,
      column,
      className,
      textSnippet,
      boundingBox: {
        x: boxModel.rect.x,
        y: boxModel.rect.y,
        width: boxModel.rect.width,
        height: boxModel.rect.height,
      },
      boxModel,
    };

    // 锁定盒模型框
    isLocked = true;
    updateOverlayGeometry(inspectTarget, true);

    // 向上发送完整选定元素信息与盒模型数据
    win.parent.postMessage(
      {
        type: 'buildui:element-selected',
        element: inspectedElement,
      },
      parentOrigin
    );

    // 兼容原有简易监听
    win.parent.postMessage(
      {
        type: 'buildui:source-selected',
        path: componentPath,
      },
      parentOrigin
    );
  };

  const handleSubmit = (event: Event) => {
    if (!parentOrigin) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  // 路由跳变通知机制 (pushState, replaceState, popstate, hashchange)
  const notifyRouteChange = () => {
    try {
      if (win.parent && win.parent !== win) {
        const loc = win.location;
        const pathname = (loc.pathname || '/') + (loc.search || '') + (loc.hash || '');
        win.parent.postMessage(
          {
            type: 'buildui:route-changed',
            pathname,
            url: loc.href,
          },
          '*'
        );
      }
    } catch {
      // 忽略跨域通知异常
    }
  };

  const origPushState = win.history?.pushState?.bind(win.history);
  const origReplaceState = win.history?.replaceState?.bind(win.history);

  if (win.history) {
    if (origPushState) {
      win.history.pushState = function (...args) {
        const result = origPushState(...args);
        notifyRouteChange();
        return result;
      };
    }
    if (origReplaceState) {
      win.history.replaceState = function (...args) {
        const result = origReplaceState(...args);
        notifyRouteChange();
        return result;
      };
    }
  }

  win.addEventListener('message', handleMessage);
  win.addEventListener('mousemove', handleMouseMove, { passive: true });
  win.addEventListener('click', handleClick, true);
  win.addEventListener('auxclick', handleClick, true);
  win.addEventListener('submit', handleSubmit, true);
  win.addEventListener('popstate', notifyRouteChange);
  win.addEventListener('hashchange', notifyRouteChange);

  return () => {
    win.removeEventListener('message', handleMessage);
    win.removeEventListener('mousemove', handleMouseMove);
    win.removeEventListener('click', handleClick, true);
    win.removeEventListener('auxclick', handleClick, true);
    win.removeEventListener('submit', handleSubmit, true);
    win.removeEventListener('popstate', notifyRouteChange);
    win.removeEventListener('hashchange', notifyRouteChange);
    if (win.history) {
      if (origPushState) win.history.pushState = origPushState;
      if (origReplaceState) win.history.replaceState = origReplaceState;
    }
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
