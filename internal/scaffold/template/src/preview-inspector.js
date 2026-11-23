(() => {
  if (typeof window === 'undefined' || !window.document || !window.parent || window.parent === window) return;

  const win = window;
  const doc = win.document;
  let parentOrigin = '';
  let overlay;
  let badge;
  let locked = false;

  const resetHighlight = () => {
    locked = false;
    if (overlay) overlay.style.display = 'none';
  };

  win.addEventListener('message', (event) => {
    if (event.source !== win.parent) return;
    if (event.data?.type === 'buildui:clear-selection') {
      resetHighlight();
    } else if (event.data?.type === 'buildui:inspect-mode') {
      parentOrigin = event.data.active ? (event.origin === 'null' ? '*' : event.origin) : '';
      doc.documentElement.style.cursor = parentOrigin ? 'crosshair' : '';
      if (!parentOrigin) resetHighlight();
    }
  });

  function describe(target) {
    const marked = target.closest('[data-buildui-source], [data-dyad-id]');
    const source = marked?.getAttribute('data-buildui-source') ?? marked?.getAttribute('data-dyad-id') ?? '';
    return {
      source,
      tagName: marked?.getAttribute('data-buildui-tag') ?? target.tagName.toLowerCase(),
      rect: (marked ?? target).getBoundingClientRect(),
    };
  }

  function highlight({ source, tagName, rect }) {
    if (!overlay) {
      overlay = doc.createElement('div');
      overlay.id = '__buildui_inspector_overlay__';
      overlay.style.cssText =
        'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #3b82f6;background:rgba(59,130,246,0.12);border-radius:4px;box-sizing:border-box;';
      badge = doc.createElement('div');
      badge.id = '__buildui_inspector_badge__';
      badge.style.cssText =
        'position:absolute;left:0;background:#1e3a8a;color:#fff;font:11px monospace;padding:2px 6px;border-radius:4px;white-space:nowrap;';
      overlay.appendChild(badge);
      doc.body.appendChild(overlay);
    }

    Object.assign(overlay.style, {
      display: 'block',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    badge.textContent = `<${tagName}> ${source.replace(/:\d+$/, '')}`;
    badge.style.top = rect.top < 26 ? 'calc(100% + 4px)' : '-24px';
  }

  win.addEventListener('mousemove', (event) => {
    if (parentOrigin && !locked && event.target instanceof Element) {
      highlight(describe(event.target));
    }
  }, { passive: true });

  win.addEventListener('click', (event) => {
    if (!parentOrigin || !(event.target instanceof Element)) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const target = event.target;
    const selection = describe(target);
    const { source, tagName, rect } = selection;
    const [, file, line, column] = source.match(/^(.*):(\d+):(\d+)$/) ?? [];
    locked = true;
    highlight(selection);

    // 只发送完整事件，等待用户在局部编辑面板确认后再填入聊天。
    win.parent.postMessage({
      type: 'buildui:element-selected',
      element: {
        id: `el-${Date.now()}`,
        tagName,
        componentPath: (file ?? source).replace(/\\/g, '/'),
        line: line ? Number(line) : undefined,
        column: column ? Number(column) : undefined,
        className: target.getAttribute('class') ?? '',
        textSnippet: (target.textContent ?? '').trim().slice(0, 80),
        boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      },
    }, parentOrigin);
  }, true);

  const notifyRouteChange = () => {
    const { pathname, search, hash, href } = win.location;
    win.parent.postMessage({ type: 'buildui:route-changed', pathname: pathname + search + hash, url: href }, '*');
  };
  for (const method of ['pushState', 'replaceState']) {
    const original = win.history[method].bind(win.history);
    win.history[method] = (...args) => {
      const result = original(...args);
      notifyRouteChange();
      return result;
    };
  }
  win.addEventListener('popstate', notifyRouteChange);
  win.addEventListener('hashchange', notifyRouteChange);
})();
