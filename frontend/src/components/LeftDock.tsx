import React from 'react';
import {
  PanelLeftClose,
  Home,
  Hammer,
  Palette,
  LayoutTemplate,
  Blocks,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export type DockTab = 'home' | 'builder' | 'style' | 'templates' | 'components' | 'settings' | 'docs' | 'help';

export interface LeftDockProps {
  activeTab?: DockTab;
  onSelectTab?: (tab: DockTab) => void;
  onToggleSidebar?: () => void;
  onOpenTemplates?: () => void;
  onOpenSettings?: () => void;
  onOpenComponents?: () => void;
  onOpenStyle?: () => void;
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
  onOpenStyle,
  onOpenDocs,
  onOpenHelp,
}) => {
  const { t } = useI18n();

  const handleTabClick = (tab: DockTab) => {
    onSelectTab?.(tab);
    if (tab === 'templates') onOpenTemplates?.();
    if (tab === 'settings') onOpenSettings?.();
    if (tab === 'components') onOpenComponents?.();
    if (tab === 'style') onOpenStyle?.();
    if (tab === 'docs') onOpenDocs?.();
    if (tab === 'help') onOpenHelp?.();
  };

  // 左侧栏图标严格依次为：首页、构建区、风格页、模版中心、组件库、设置
  const dockItems = [
    { id: 'home' as const, testId: 'dock-home', icon: Home, label: t('dock.home') },
    { id: 'builder' as const, testId: 'dock-builder', icon: Hammer, label: t('dock.builder') },
    { id: 'style' as const, testId: 'dock-style', icon: Palette, label: t('dock.style') },
    { id: 'templates' as const, testId: 'dock-templates', icon: LayoutTemplate, label: t('dock.templates') },
    { id: 'components' as const, testId: 'dock-components', icon: Blocks, label: t('dock.components') },
    { id: 'settings' as const, testId: 'dock-settings', icon: Settings, label: t('dock.settings') },
  ];

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

        {/* 导航图标列表：首页、构建区、风格页、模版中心、组件库、设置 */}
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              data-testid={item.testId}
              title={item.label}
              className={`p-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 shadow-2xs font-medium'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
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
