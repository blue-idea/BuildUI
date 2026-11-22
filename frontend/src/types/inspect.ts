export interface CodeRegion {
  filePath: string;
  startLine: number;
  endLine: number;
  codeSnippet: string;
  found: boolean;
  message?: string;
}

export interface InspectedElement {
  id: string;
  tagName: string;
  componentPath: string;
  line?: number;
  column?: number;
  className?: string;
  textSnippet?: string;
  selector?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  codeRegion?: CodeRegion;
}

export interface QuickActionPreset {
  id: string;
  label: string;
  icon?: string;
  promptTemplate: (element: InspectedElement) => string;
}
