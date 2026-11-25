import catalog from '../../../internal/config/project_templates.json';
import type { AppTemplate } from '../components/TemplateModal';
import type { ProjectPlatform } from '../components/AppDrawer';

export const BLANK_PROJECT_TEMPLATE = 'blank';
export const NATIVE_APP_TEMPLATE = 'react-native';
export const NATIVE_APP_STACK = 'Expo + React Native + NativeWind + Expo Router + Font Awesome';
export const NEXT_APP_TEMPLATE = 'next';
export const NEXT_APP_STACK = 'Next.js App Router + React + TypeScript + Tailwind CSS';
export const DEFAULT_PROJECT_TEMPLATE = catalog.defaultId;
export const SELECTED_TEMPLATE_KEY = catalog.selectionKey;
export const COMMUNITY_TEMPLATE_CONSENT_KEY = catalog.consentKey;
export const LOCAL_PROJECT_TEMPLATES = catalog.templates as AppTemplate[];

export function isProjectTemplateCompatible(template: AppTemplate, projectPlatform: ProjectPlatform): boolean {
  const templatePlatform = template.platform ?? 'web';
  // 桌面项目可以使用 Web 脚手架，移动项目使用支持 App 的脚手架。
  return templatePlatform === projectPlatform || (projectPlatform === 'desktop' && templatePlatform === 'web');
}
