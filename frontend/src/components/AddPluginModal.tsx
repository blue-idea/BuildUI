import React, { useState, useEffect } from 'react';
import type { PluginConfig, PluginItem } from '../types/plugin';
import { X, Plug, AlertCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface AddPluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: PluginConfig;
  onSubmit: (plugin: PluginDraft) => void | Promise<void>;
}

export type PluginDraft = Omit<PluginItem, 'id'> & Pick<PluginConfig, 'transport' | 'args'>;

export const AddPluginModal: React.FC<AddPluginModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initial,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [transport, setTransport] = useState<PluginConfig['transport']>('http');
  const [args, setArgs] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? '');
      setDomain(initial?.endpoint ?? '');
      setDescription(initial?.description ?? '');
      setTransport(initial?.transport ?? 'http');
      setArgs(initial?.args?.length ? JSON.stringify(initial.args) : '');
      setErrorMessage('');
    }
  }, [isOpen, initial]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage(t('pluginsPage.errorNameRequired'));
      return;
    }
    if (!domain.trim()) {
      setErrorMessage(t('pluginsPage.errorEndpointRequired'));
      return;
    }

    let parsedArgs: string[] = [];
    if (transport === 'stdio' && args.trim()) {
      try {
        const list: unknown = JSON.parse(args);
        if (!Array.isArray(list) || list.some((item) => typeof item !== 'string')) throw new Error();
        parsedArgs = list;
      } catch {
        setErrorMessage('Arguments must be a JSON array of strings.');
        return;
      }
    }
    const pending = onSubmit({
      name: name.trim(),
      domain: domain.trim(),
      description: description.trim() || 'Custom user configured MCP plugin tool.',
      badge: transport === 'http' ? 'HTTP' : 'STDIO',
      category: 'custom',
      toolsCount: 0,
      isInstalled: true,
      enabled: true,
      transport,
      args: parsedArgs,
    });
    if (!pending) { onClose(); return; }
    setSaving(true);
    void pending.then(onClose).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }).finally(() => setSaving(false));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plugin-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* 顶部标题与关闭按钮 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Plug className="w-4 h-4" />
            </div>
            <div>
              <h3 id="plugin-form-title" className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {initial?.id ? 'Edit Plugin' : t('pluginsPage.modalTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t('pluginsPage.modalDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label htmlFor="plugin-name" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              {t('pluginsPage.modalNameLabel')}
            </label>
            <input
              type="text"
              id="plugin-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder={t('pluginsPage.modalNamePlaceholder')}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <label className="block space-y-1 text-xs font-semibold">
            <span>Transport</span>
            <select value={transport} onChange={(e) => { setTransport(e.target.value as PluginConfig['transport']); setDomain(''); }} className="block w-full rounded-xl border border-slate-200 p-2 dark:border-zinc-700 dark:bg-zinc-800">
              <option value="http">Streamable HTTP</option>
              <option value="stdio">Standard input/output (stdio)</option>
            </select>
          </label>

          <div>
            <label htmlFor="plugin-endpoint" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              {transport === 'stdio' ? 'Command' : 'Server URL'}
            </label>
            <input
              type="text"
              id="plugin-endpoint"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder={transport === 'stdio' ? 'npx' : t('pluginsPage.modalEndpointPlaceholder')}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {transport === 'stdio' && <label className="block space-y-1 text-xs font-semibold">
            <span>Arguments</span>
            <input value={args} onChange={(e) => setArgs(e.target.value)} placeholder='["-y", "your-mcp-server"]' className="block w-full rounded-xl border border-slate-200 p-2 dark:border-zinc-700 dark:bg-zinc-800" />
          </label>}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              {t('pluginsPage.modalDescLabel')}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('pluginsPage.modalDescPlaceholder')}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {t('pluginsPage.modalCancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              data-testid="btn-submit-plugin"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
            >
              {saving ? 'Saving…' : initial?.id ? 'Save' : t('pluginsPage.modalSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
