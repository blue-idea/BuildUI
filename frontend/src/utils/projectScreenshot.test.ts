import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  captureIframeScreenshot,
  captureHtmlDocumentScreenshot,
  loadPersistedProjectThumbnails,
  savePersistedProjectThumbnail,
  removePersistedProjectThumbnail,
} from './projectScreenshot';

describe('projectScreenshot 工具模块 (v33.REQ-002)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // v33.REQ-002-AC-002：Web 演示模式持久化读写与删除
  it('将项目缩略图持久化到 localStorage 并支持读取与删除', () => {
    expect(loadPersistedProjectThumbnails()).toEqual({});

    savePersistedProjectThumbnail(1, 'data:image/png;base64,AAAA');
    savePersistedProjectThumbnail(2, 'data:image/png;base64,BBBB');
    expect(loadPersistedProjectThumbnails()).toEqual({
      1: 'data:image/png;base64,AAAA',
      2: 'data:image/png;base64,BBBB',
    });

    // 覆盖已有项目的截图
    savePersistedProjectThumbnail(1, 'data:image/png;base64,CCCC');
    expect(loadPersistedProjectThumbnails()[1]).toBe('data:image/png;base64,CCCC');

    // 删除指定项目缩略图
    removePersistedProjectThumbnail(1);
    expect(loadPersistedProjectThumbnails()).toEqual({
      2: 'data:image/png;base64,BBBB',
    });
  });

  // v33.REQ-002-AC-001：同源 / srcDoc iframe DOM 截图返回合法图片 DataURL
  it('捕获同源 iframe 文档并返回合法图片 DataURL', async () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    try {
      const doc = iframe.contentDocument!;
      doc.open();
      doc.write('<!DOCTYPE html><html><head><style>body{background:#fff;}</style></head><body><h1>Hello Pantry</h1></body></html>');
      doc.close();

      const dataUrl = await captureIframeScreenshot(iframe, { width: 640, height: 400 });
      expect(dataUrl).toMatch(/^data:image\/(png|svg\+xml);base64,/);
    } finally {
      iframe.remove();
    }
  });

  // v33.REQ-002-AC-001：跨域 iframe 通过 postMessage 协议请求预览脚本返回截图
  it('跨域 iframe 无法访问 contentDocument 时通过 postMessage 协议完成截图', async () => {
    const postedMessages: Array<{ data: any; origin: string }> = [];
    const fakeContentWindow = {
      postMessage: vi.fn((data: any, origin: string) => {
        postedMessages.push({ data, origin });
        if (data?.type === 'buildui:capture-screenshot') {
          setTimeout(() => {
            window.dispatchEvent(
              new MessageEvent('message', {
                origin: 'http://127.0.0.1:5173',
                source: fakeContentWindow as unknown as MessageEventSource,
                data: {
                  type: 'buildui:screenshot-captured',
                  requestId: data.requestId,
                  dataUrl: 'data:image/png;base64,ZmFrZS1wbmc=',
                },
              })
            );
          }, 10);
        }
      }),
    };

    const crossOriginIframe = {
      get contentDocument() {
        throw new DOMException('Blocked a frame with origin from accessing a cross-origin frame.', 'SecurityError');
      },
      contentWindow: fakeContentWindow,
    } as unknown as HTMLIFrameElement;

    const result = await captureIframeScreenshot(crossOriginIframe, {
      targetOrigin: 'http://127.0.0.1:5173',
      timeoutMs: 500,
    });

    expect(postedMessages).toHaveLength(1);
    expect(postedMessages[0].data.type).toBe('buildui:capture-screenshot');
    expect(postedMessages[0].origin).toBe('http://127.0.0.1:5173');
    expect(result).toBe('data:image/png;base64,ZmFrZS1wbmc=');
  });

  // v33.REQ-002-AC-001：Web 模式下可直接从 HTML 沙箱文档生成项目封面截图
  it('通过 HTML 文档字符串捕获独立项目封面截图', async () => {
    const dataUrl = await captureHtmlDocumentScreenshot(
      '<!DOCTYPE html><html><head><style>body{background:#0f172a;color:#fff;}</style></head><body><h2>Demo App</h2></body></html>',
      { width: 640, height: 400 }
    );
    expect(dataUrl).toMatch(/^data:image\/(png|svg\+xml);base64,/);
  });
});
