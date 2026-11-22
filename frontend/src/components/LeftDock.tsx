import React from 'react';
import {
  Home,
  Hammer,
  Palette,
  LayoutTemplate,
  Blocks,
  Settings,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export type DockTab = 'home' | 'builder' | 'style' | 'templates' | 'components' | 'settings' | 'docs';

export interface LeftDockProps {
  activeTab?: DockTab;
  onSelectTab?: (tab: DockTab) => void;
  onOpenTemplates?: () => void;
  onOpenSettings?: () => void;
  onOpenComponents?: () => void;
  onOpenStyle?: () => void;
  onOpenDocs?: () => void;
}

export const LeftDock: React.FC<LeftDockProps> = ({
  activeTab = 'home',
  onSelectTab,
  onOpenTemplates,
  onOpenSettings,
  onOpenComponents,
  onOpenStyle,
  onOpenDocs,
}) => {
  const { t } = useI18n();

  const handleTabClick = (tab: DockTab) => {
    onSelectTab?.(tab);
    if (tab === 'templates') onOpenTemplates?.();
    if (tab === 'settings') onOpenSettings?.();
    if (tab === 'components') onOpenComponents?.();
    if (tab === 'style') onOpenStyle?.();
    if (tab === 'docs') onOpenDocs?.();
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
    <aside className="w-[52px] shrink-0 h-full bg-slate-50 dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col items-center py-3 select-none z-20 transition-colors">
      {/* 导航图标列表：首页、构建区、风格页、模版中心、组件库、设置 */}
      <div className="flex flex-col items-center gap-2.5 w-full">
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
    </aside>
  );
};

export default LeftDock;
