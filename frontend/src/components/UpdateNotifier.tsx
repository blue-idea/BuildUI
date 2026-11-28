import { useState, useEffect } from 'react';
import { Download, Sparkles, Terminal, Check } from 'lucide-react';
import { essentialEvent, openExternalUrl } from '../services/wailsBridge';

export interface UpdatePayload {
  available: boolean;
  version: string;
  releaseUrl: string;
  downloadUrl: string;
  error?: string;
}

export interface UpdateNotifierProps {
  subscribe?: (eventName: string, handler: (payload: UpdatePayload) => void) => () => void;
  openUrl?: (url: string) => void;
}

const DISMISSED_VERSION_KEY = 'buildui.update.dismissedVersion';
const EVENT_UPDATE_AVAILABLE = 'buildui:update-available';

export function UpdateNotifier({
  subscribe = (eventName, handler) => essentialEvent(eventName, handler),
  openUrl = openExternalUrl,
}: UpdateNotifierProps) {
  const [update, setUpdate] = useState<UpdatePayload | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe(EVENT_UPDATE_AVAILABLE, (payload) => {
      if (!payload?.available || !payload.version) {
        return;
      }
      try {
        const dismissed = window.localStorage.getItem(DISMISSED_VERSION_KEY);
        if (dismissed === payload.version) {
          return;
        }
      } catch {
        // localStorage 不可用时继续展示
      }
      setUpdate(payload);
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  if (!update) return null;

  const brewCmd = 'brew upgrade buildui';

  const handleCopyBrew = async () => {
    try {
      await navigator.clipboard.writeText(brewCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 忽略剪贴板写入失败
    }
  };

  const handleLater = () => {
    try {
      window.localStorage.setItem(DISMISSED_VERSION_KEY, update.version);
    } catch {
      // 忽略存储失败
    }
    setUpdate(null);
  };

  const handleDownload = () => {
    const targetUrl = update.downloadUrl || update.releaseUrl;
    if (targetUrl) {
      openUrl(targetUrl);
    }
    setUpdate(null);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/80 dark:border-zinc-700/70 bg-white/85 dark:bg-zinc-900/85 p-4 text-slate-800 dark:text-zinc-100 shadow-2xl backdrop-blur-xl transition-colors"
    >
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/15 dark:ring-blue-400/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              New Version v{update.version} Available
            </h4>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
            A new version of BuildUI is ready. macOS users can upgrade seamlessly via Homebrew:
          </p>

          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-slate-100/85 dark:bg-zinc-950/75 px-2.5 py-1.5 font-mono text-xs text-blue-700 dark:text-blue-300 border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 truncate">
              <Terminal className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
              <span className="truncate">{brewCmd}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyBrew}
              className="shrink-0 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              title="Copy command"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : 'Copy'}
            </button>
          </div>

          <div className="mt-3.5 flex items-center justify-end gap-2">
            <button
              type="button"
              data-testid="btn-update-later"
              onClick={handleLater}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
            >
              Later
            </button>
            <button
              type="button"
              data-testid="btn-update-download"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
