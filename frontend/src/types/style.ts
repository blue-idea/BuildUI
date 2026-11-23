export type StyleAppType = 'web' | 'app' | 'desktop';

export interface ColorPalette {
  primary: string;
  accent?: string;
  background: string;
  surface: string;
  text: string;
  textMuted?: string;
  border: string;
}

export interface ExtractedStyle {
  id: string;
  name: string;
  appType?: StyleAppType;
  referenceSource: string; // 如 'Linear', 'Stripe', 'Screenshot'
  palette: ColorPalette;
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  typography: string;
  tags: string[];
  stylePrompt?: string;
  designPrompt: string;
  createdAt: string;
}

export interface StyleTemplate extends ExtractedStyle {
  isPreset?: boolean;
}
