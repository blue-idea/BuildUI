(() => {
  if (typeof window === 'undefined' || !window.document || !window.parent || window.parent === window) return;

  const win = window;
  const doc = win.document;
  let parentOrigin = '';
  let overlay;
  let badge;
  let lockedSelection;
  let highlightFrame = null;

  const resetHighlight = () => {
    lockedSelection = undefined;
    if (highlightFrame !== null) {
      win.cancelAnimationFrame(highlightFrame);
      highlightFrame = null;
    }
    if (overlay) overlay.style.display = 'none';
  };

  win.addEventListener('message', (event) => {
    if (event.source !== win.parent) return;
    if (event.data?.type === 'buildui:traverse-history') {
      const direction = event.data.direction;
      const navigation = win.navigation;
      const canGo = direction === 'back' ? navigation?.canGoBack : direction === 'forward' && navigation?.canGoForward;
      // Navigation API 只遍历当前 iframe 的同源历史条目。
      if (canGo) navigation[direction]().finished.catch(() => {});
    } else if (event.data?.type === 'buildui:clear-selection') {
      resetHighlight();
    } else if (event.data?.type === 'buildui:inspect-mode') {
      parentOrigin = event.data.active ? (event.origin === 'null' ? '*' : event.origin) : '';
      doc.documentElement.style.cursor = parentOrigin ? 'crosshair' : '';
      if (!parentOrigin) resetHighlight();
    } else if (event.data?.type === 'buildui:capture-screenshot') {
      const requestId = event.data.requestId;
      const width = Number(event.data.width) || Math.max(win.innerWidth || 1280, 320);
      const height = Number(event.data.height) || Math.max(win.innerHeight || 800, 240);
      const replyOrigin = event.origin && event.origin !== 'null' ? event.origin : '*';
      captureViewportScreenshot(width, height)
        .then((dataUrl) => {
          win.parent.postMessage({ type: 'buildui:screenshot-captured', requestId, dataUrl }, replyOrigin);
        })
        .catch((err) => {
          win.parent.postMessage({
            type: 'buildui:screenshot-captured',
            requestId,
            error: err instanceof Error ? err.message : 'Failed to capture preview screenshot',
          }, replyOrigin);
        });
    }
  });

  // 在沙箱 iframe 同源内部截取当前视口快照（作为无头浏览器不可用时的前端降级能力）
  async function captureViewportScreenshot(width, height) {
    const prevDisplay = overlay ? overlay.style.display : '';
    if (overlay) overlay.style.display = 'none';
    try {
      const clone = (doc.body || doc.documentElement).cloneNode(true);
      clone.querySelectorAll('script, #__buildui_inspector_overlay__').forEach((n) => n.remove());
      const cssParts = [];
      doc.querySelectorAll('style').forEach((s) => {
        if (s.textContent) cssParts.push(s.textContent);
      });
      try {
        Array.from(doc.styleSheets || []).forEach((sheet) => {
          if (sheet.ownerNode && sheet.ownerNode.tagName === 'STYLE') return;
          try {
            const rules = Array.from(sheet.cssRules || []).map((r) => r.cssText).join('\n');
            if (rules) cssParts.push(rules);
          } catch {}
        });
      } catch {}
      const bg = (doc.body && win.getComputedStyle(doc.body).backgroundColor) || '#ffffff';
      const serialized = new XMLSerializer().serializeToString(clone);
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
        `<rect width="100%" height="100%" fill="${bg === 'rgba(0, 0, 0, 0)' ? '#ffffff' : bg}"/>` +
        `<foreignObject width="100%" height="100%">` +
        `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;">` +
        (cssParts.length ? `<style><![CDATA[${cssParts.join('\n').replace(/]]>/g, ']]]]><![CDATA[>')}]]></style>` : '') +
        serialized +
        `</div></foreignObject></svg>`;
      const bytes = new TextEncoder().encode(svg);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const svgUrl = 'data:image/svg+xml;base64,' + btoa(bin);
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = doc.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context unavailable'));
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error('Failed to render screenshot image'));
        img.src = svgUrl;
      });
    } finally {
      if (overlay) overlay.style.display = prevDisplay;
    }
  }

  function describe(target) {
    const marked = target.closest('[data-buildui-source], [data-dyad-id]');
    const source = marked?.getAttribute('data-buildui-source') ?? marked?.getAttribute('data-dyad-id') ?? '';
    const element = marked ?? target;
    return {
      element,
      source,
      tagName: marked?.getAttribute('data-buildui-tag') ?? target.tagName.toLowerCase(),
      rect: element.getBoundingClientRect(),
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

  // 捕获页面和内部容器的滚动，每帧按锁定元素的当前视口坐标重绘。
  win.addEventListener('scroll', () => {
    if (!lockedSelection || highlightFrame !== null) return;
    highlightFrame = win.requestAnimationFrame(() => {
      highlightFrame = null;
      if (!lockedSelection.element.isConnected) {
        resetHighlight();
        return;
      }
      highlight({ ...lockedSelection, rect: lockedSelection.element.getBoundingClientRect() });
    });
  }, { capture: true, passive: true });

  win.addEventListener('mousemove', (event) => {
    if (parentOrigin && !lockedSelection && event.target instanceof Element) {
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
    lockedSelection = selection;
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
