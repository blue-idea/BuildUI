import React, { useState, useEffect } from 'react';
import { PluginItem } from '../types/plugin';
import { X, Plug, AlertCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface AddPluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plugin: Omit<PluginItem, 'id'>) => void;
}

export const AddPluginModal: React.FC<AddPluginModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('Custom');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDomain('');
      setDescription('');
      setBadge('Custom');
      setErrorMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

    onSubmit({
      name: name.trim(),
      domain: domain.trim(),
      description: description.trim() || 'Custom user configured MCP plugin tool.',
      badge,
      category: 'custom',
      toolsCount: 1,
      isInstalled: true,
      enabled: true,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
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
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {t('pluginsPage.modalTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t('pluginsPage.modalDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              {t('pluginsPage.modalNameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder={t('pluginsPage.modalNamePlaceholder')}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              {t('pluginsPage.modalEndpointLabel')}
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder={t('pluginsPage.modalEndpointPlaceholder')}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

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
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {t('pluginsPage.modalCancel')}
            </button>
            <button
              type="submit"
              data-testid="btn-submit-plugin"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
            >
              {t('pluginsPage.modalSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
