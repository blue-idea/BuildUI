/**
 * 项目预览截图工具模块
 * 支持同源 / srcDoc iframe DOM 截图、跨域 iframe postMessage 降级截图、
 * 离屏 HTML 文档封面渲染与 Web 演示模式 localStorage 持久化。
 */

import {
  PROJECT_THUMBNAILS_STORAGE_KEY,
  SCREENSHOT_DEFAULT_HEIGHT,
  SCREENSHOT_DEFAULT_WIDTH,
  SCREENSHOT_POSTMESSAGE_TIMEOUT_MS,
} from '../config/screenshot';

export interface CaptureScreenshotOptions {
  width?: number;
  height?: number;
  targetOrigin?: string;
  timeoutMs?: number;
}

/** 读取 Web 演示模式下持久化的项目封面缩略图映射 */
export function loadPersistedProjectThumbnails(): Record<number, string> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(PROJECT_THUMBNAILS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<number, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = Number(k);
      if (Number.isFinite(id) && id > 0 && typeof v === 'string' && v.startsWith('data:image/')) {
        result[id] = v;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/** 将指定项目的封面截图持久化至 localStorage */
export function savePersistedProjectThumbnail(appId: number, dataUrl: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  if (!Number.isFinite(appId) || appId <= 0 || !dataUrl.startsWith('data:image/')) return;
  try {
    const current = loadPersistedProjectThumbnails();
    current[appId] = dataUrl;
    localStorage.setItem(PROJECT_THUMBNAILS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // 忽略存储空间满或隐私模式异常
  }
}

/** 移除指定项目的持久化封面缩略图 */
export function removePersistedProjectThumbnail(appId: number): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const current = loadPersistedProjectThumbnails();
    if (appId in current) {
      delete current[appId];
      localStorage.setItem(PROJECT_THUMBNAILS_STORAGE_KEY, JSON.stringify(current));
    }
  } catch {
    // 忽略异常
  }
}

function encodeUtf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** 收集文档中的内联与可访问样式表规则 */
function collectStylesText(doc: Document): string {
  const parts: string[] = [];
  doc.querySelectorAll('style').forEach((styleEl) => {
    if (styleEl.textContent) parts.push(styleEl.textContent);
  });
  try {
    Array.from(doc.styleSheets || []).forEach((sheet) => {
      if (sheet.ownerNode && (sheet.ownerNode as Element).tagName === 'STYLE') return;
      try {
        const rules = Array.from(sheet.cssRules || []).map((r) => r.cssText).join('\n');
        if (rules) parts.push(rules);
      } catch {
        // 忽略受 CORS 限制的外部样式表
      }
    });
  } catch {
    // 忽略样式表遍历异常
  }
  return parts.join('\n');
}

/** 将同源 Document 序列化为包含样式的 SVG foreignObject DataURL */
export function serializeDocumentToSvgDataUrl(
  doc: Document,
  width: number = SCREENSHOT_DEFAULT_WIDTH,
  height: number = SCREENSHOT_DEFAULT_HEIGHT
): string {
  const cloneRoot = (doc.body ? doc.body.cloneNode(true) : doc.documentElement.cloneNode(true)) as HTMLElement;
  // 移除脚本与审查覆盖层，避免污染截图
  cloneRoot
    .querySelectorAll('script, #__buildui_inspector_overlay__')
    .forEach((node) => node.remove());

  const styles = collectStylesText(doc);
  const bodyBg =
    (doc.defaultView && doc.body ? doc.defaultView.getComputedStyle(doc.body).backgroundColor : '') ||
    '#ffffff';
  const serializer = new XMLSerializer();
  const serializedBody = serializer.serializeToString(cloneRoot);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${bodyBg === 'rgba(0, 0, 0, 0)' ? '#ffffff' : bodyBg}" />`,
    `<foreignObject width="100%" height="100%">`,
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;">`,
    styles ? `<style><![CDATA[${styles.replace(/]]>/g, ']]]]><![CDATA[>')}]]></style>` : '',
    serializedBody,
    `</div>`,
    `</foreignObject>`,
    `</svg>`,
  ].join('');

  return `data:image/svg+xml;base64,${encodeUtf8ToBase64(svg)}`;
}

/** 在真实浏览器环境中将 SVG DataURL 光栅化为 PNG DataURL，不支持 Canvas 时安全退回 SVG */
async function rasterizeSvgToPng(
  svgDataUrl: string,
  width: number,
  height: number
): Promise<string> {
  if (
    typeof document === 'undefined' ||
    typeof Image === 'undefined' ||
    (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent))
  ) {
    return svgDataUrl;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }
  if (!ctx) {
    return svgDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(svgDataUrl), 1500);
    img.onload = () => {
      window.clearTimeout(timer);
      try {
        ctx!.drawImage(img, 0, 0, width, height);
        const png = canvas.toDataURL('image/png');
        resolve(png && png.startsWith('data:image/png;base64,') ? png : svgDataUrl);
      } catch {
        resolve(svgDataUrl);
      }
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(svgDataUrl);
    };
    img.src = svgDataUrl;
  });
}

/** 通过 postMessage 向注入了预览脚本的跨域 iframe 请求 DOM 截图 */
function requestCrossOriginIframeScreenshot(
  iframe: HTMLIFrameElement,
  options: CaptureScreenshotOptions
): Promise<string> {
  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    return Promise.reject(new Error('Preview frame is unavailable for screenshot capture.'));
  }

  const width = options.width ?? SCREENSHOT_DEFAULT_WIDTH;
  const height = options.height ?? SCREENSHOT_DEFAULT_HEIGHT;
  const targetOrigin = options.targetOrigin || '*';
  const timeoutMs = options.timeoutMs ?? SCREENSHOT_POSTMESSAGE_TIMEOUT_MS;
  const requestId = `shot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise<string>((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      window.clearTimeout(timer);
    };

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for preview screenshot response.'));
    }, timeoutMs);

    const handleMessage = (event: MessageEvent) => {
      if (targetOrigin !== '*' && event.origin !== targetOrigin) return;
      if (event.source && event.source !== frameWindow) return;
      const payload = event.data;
      if (!payload || payload.type !== 'buildui:screenshot-captured' || payload.requestId !== requestId) {
        return;
      }
      cleanup();
      if (typeof payload.dataUrl === 'string' && payload.dataUrl.startsWith('data:image/')) {
        resolve(payload.dataUrl);
      } else {
        reject(new Error(payload.error || 'Failed to capture preview screenshot from frame.'));
      }
    };

    window.addEventListener('message', handleMessage);
    frameWindow.postMessage(
      {
        type: 'buildui:capture-screenshot',
        requestId,
        width,
        height,
      },
      targetOrigin
    );
  });
}

/**
 * 捕获当前预览 iframe 画面为图片 DataURL
 * 优先直读同源/srcDoc DOM；遇到跨域限制时自动通过 postMessage 桥接子页面截图。
 * 覆盖验收标准：v33.REQ-002-AC-001
 */
export async function captureIframeScreenshot(
  iframe: HTMLIFrameElement,
  options: CaptureScreenshotOptions = {}
): Promise<string> {
  const width = options.width ?? SCREENSHOT_DEFAULT_WIDTH;
  const height = options.height ?? SCREENSHOT_DEFAULT_HEIGHT;

  let sameOriginDoc: Document | null = null;
  try {
    const doc = iframe.contentDocument;
    if (doc && doc.documentElement && (doc.body?.innerHTML || doc.head?.innerHTML)) {
      sameOriginDoc = doc;
    }
  } catch {
    sameOriginDoc = null;
  }

  if (sameOriginDoc) {
    const svgDataUrl = serializeDocumentToSvgDataUrl(sameOriginDoc, width, height);
    return rasterizeSvgToPng(svgDataUrl, width, height);
  }

  return requestCrossOriginIframeScreenshot(iframe, { ...options, width, height });
}

/**
 * 从独立 HTML 文档字符串渲染并捕获封面图片（供 Web 演示模式在工程管理页截取任意项目）
 * 覆盖验收标准：v33.REQ-002-AC-001
 */
export async function captureHtmlDocumentScreenshot(
  html: string,
  options: CaptureScreenshotOptions = {}
): Promise<string> {
  const width = options.width ?? SCREENSHOT_DEFAULT_WIDTH;
  const height = options.height ?? SCREENSHOT_DEFAULT_HEIGHT;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const svgDataUrl = serializeDocumentToSvgDataUrl(doc, width, height);
  return rasterizeSvgToPng(svgDataUrl, width, height);
}
