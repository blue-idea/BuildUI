export interface CodeRegion {
  filePath: string;
  startLine: number;
  endLine: number;
  codeSnippet: string;
  found: boolean;
  message?: string;
}

export interface BoxModelSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BoxModelMetrics {
  margin: BoxModelSides;
  border: BoxModelSides;
  padding: BoxModelSides;
  content: { width: number; height: number };
  rect: { top: number; left: number; width: number; height: number; x: number; y: number };
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
  boxModel?: BoxModelMetrics;
  codeRegion?: CodeRegion;
}

export interface QuickActionPreset {
  id: string;
  label: string;
  icon?: string;
  promptTemplate: (element: InspectedElement) => string;
}
