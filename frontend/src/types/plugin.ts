export interface PluginItem {
  id: string;
  name: string;
  badge?: string; // 如 'OAuth', 'STDIO', 'SSE'
  description: string;
  domain: string;
  endpoint?: string;
  transport?: PluginConfig['transport'];
  args?: string[];
  migrationUrl?: string;
  supportsOAuth?: boolean;
  credential?: {
    transport: PluginConfig['transport'];
    name: string;
    hint: string;
    valuePlaceholder?: string;
    required?: boolean;
  };
  category: 'featured' | 'ai_media' | 'developer' | 'custom';
  iconUrl?: string;
  iconColor?: string;
  iconBg?: string;
  iconText?: string;
  toolsCount: number;
  isInstalled?: boolean;
  enabled?: boolean;
}

export interface CatalogCategory {
  id: string;
  title: string;
  icon?: string;
  plugins: PluginItem[];
}

export interface PluginConfig {
  id: number;
  name: string;
  description: string;
  transport: 'http' | 'stdio';
  endpoint: string;
  args?: string[] | null;
  enabled: boolean;
  catalogId?: string;
  appId?: number | null;
}

export interface InstalledPlugin extends PluginConfig {
  headers?: string[] | null;
  env?: string[] | null;
  credentialsUnreadable?: boolean;
  oauthConnected?: boolean;
}

export interface PluginTool {
  name: string;
  description: string;
  allowed: boolean;
}

export interface PluginAutomation {
  enabled: boolean;
  pluginIds: number[];
}
