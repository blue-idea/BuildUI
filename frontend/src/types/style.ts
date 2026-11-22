export interface ColorPalette {
  primary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}

export interface ExtractedStyle {
  id: string;
  name: string;
  referenceSource: string; // 如 'Linear', 'Stripe', 'Screenshot'
  palette: ColorPalette;
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  typography: string;
  tags: string[];
  designPrompt: string;
  createdAt: string;
}

export interface StyleTemplate extends ExtractedStyle {
  isPreset?: boolean;
}
