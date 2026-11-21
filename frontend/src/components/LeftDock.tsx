import React from 'react';
import {
  PanelLeftClose,
  Home,
  Settings,
  BookOpen,
  LayoutTemplate,
  Blocks,
  HelpCircle,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export type DockTab = 'home' | 'settings' | 'docs' | 'templates' | 'components' | 'help';

export interface LeftDockProps {
  activeTab?: DockTab;
  onSelectTab?: (tab: DockTab) => void;
  onToggleSidebar?: () => void;
  onOpenTemplates?: () => void;
  onOpenSettings?: () => void;
  onOpenComponents?: () => void;
  onOpenDocs?: () => void;
  onOpenHelp?: () => void;
}

export const LeftDock: React.FC<LeftDockProps> = ({
  activeTab = 'home',
  onSelectTab,
  onToggleSidebar,
  onOpenTemplates,
  onOpenSettings,
  onOpenComponents,
  onOpenDocs,
  onOpenHelp,
}) => {
  const { t } = useI18n();

  const handleTabClick = (tab: DockTab) => {
    onSelectTab?.(tab);
    if (tab === 'templates') onOpenTemplates?.();
    if (tab === 'settings') onOpenSettings?.();
    if (tab === 'components') onOpenComponents?.();
    if (tab === 'docs') onOpenDocs?.();
    if (tab === 'help') onOpenHelp?.();
  };

  return (
    <aside className="w-[52px] shrink-0 h-full bg-slate-50 dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-between py-3 select-none z-20 transition-colors">
      {/* 顶部图标组 */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* 折叠侧栏 */}
        <button
          type="button"
          onClick={onToggleSidebar}
          data-testid="dock-toggle"
          title={t('dock.toggle')}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>

        {/* Home 图标（选中态带浅紫胶囊背景） */}
        <button
          type="button"
          onClick={() => handleTabClick('home')}
          data-testid="dock-home"
          title={t('dock.home')}
          className={`p-2 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Settings 图标 */}
        <button
          type="button"
          onClick={() => handleTabClick('settings')}
          data-testid="dock-settings"
          title={t('dock.settings')}
          className={`p-2 rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
              : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Docs 文档图标 */}
        <button
          type="button"
          onClick={() => handleTabClick('docs')}
          data-testid="dock-docs"
          title={t('dock.docs')}
          className={`p-2 rounded-xl transition-all ${
            activeTab === 'docs'
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
              : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Templates 模版图标 */}
        <button
          type="button"
          onClick={() => handleTabClick('templates')}
          data-testid="dock-templates"
          title={t('dock.templates')}
          className={`p-2 rounded-xl transition-all ${
            activeTab === 'templates'
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
              : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
        </button>

        {/* Components 组件审查图标 */}
        <button
          type="button"
          onClick={() => handleTabClick('components')}
          data-testid="dock-components"
          title={t('dock.components')}
          className={`p-2 rounded-xl transition-all ${
            activeTab === 'components'
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
              : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Blocks className="w-4 h-4" />
        </button>
      </div>

      {/* 底部 Help 帮助图标 */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={() => handleTabClick('help')}
          data-testid="dock-help"
          title={t('dock.help')}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
