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
export const LOCAL_PROJECT_TEMPLATES = catalog.templates as AppTemplate[];

export function getOfficialProjectTemplates(templates: readonly AppTemplate[] = LOCAL_PROJECT_TEMPLATES): AppTemplate[] {
  return templates.filter((template) => template.source === 'official');
}

export function getProjectTemplatePlatform(id?: string): ProjectPlatform | undefined {
  return LOCAL_PROJECT_TEMPLATES.find((template) => template.id === id)?.platform;
}

export function isProjectTemplateCompatible(template: AppTemplate, projectPlatform: ProjectPlatform): boolean {
  // Desktop 的起步模板固定为 React。
  if (projectPlatform === 'desktop') return template.id === 'react';
  return (template.platform ?? 'web') === projectPlatform;
}
