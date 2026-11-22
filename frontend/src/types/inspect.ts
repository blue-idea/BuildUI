export interface InspectedElement {
  id: string;
  tagName: string;
  componentPath: string;
  className?: string;
  textSnippet?: string;
  selector?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface QuickActionPreset {
  id: string;
  label: string;
  icon?: string;
  promptTemplate: (element: InspectedElement) => string;
}
