import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  themeId?: string;
}

export interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: AppTemplate[];
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelectTemplate,
}) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTemplates = templates.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* 顶部标题与搜索栏 */}
        <div className="flex flex-col border-b border-slate-800 p-5 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm">
                ✨
              </span>
              <div>
                <h2 className="text-base font-bold text-white">{t('modals.templateTitle')}</h2>
                <p className="text-xs text-slate-400">
                  {t('modals.templateDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close template modal"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('modals.templateSearch')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 模版卡片网格列表 */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredTemplates.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-500 text-xs">
              <span className="text-2xl mb-2">🔍</span>
              <span>No templates matching &quot;{searchQuery}&quot;</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-blue-500/50 hover:bg-slate-950 hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <h3 className="font-semibold text-sm text-slate-100 group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-medium border border-slate-700/60">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTemplate(item.id)}
                    aria-label={`Use template ${item.name}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                  >
                    <span>{t('modals.useTemplate')}</span>
                    <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
