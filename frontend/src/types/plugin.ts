export interface PluginItem {
  id: string;
  name: string;
  badge?: string; // 如 'OAuth', 'STDIO', 'SSE'
  description: string;
  domain: string;
  category: 'featured' | 'ai_media' | 'developer' | 'custom';
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
