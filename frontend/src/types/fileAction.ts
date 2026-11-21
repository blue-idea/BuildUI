export type FileActionStatus = 'writing' | 'completed' | 'idle' | 'error';

export interface FileActionItem {
  id: string;
  filename: string;
  path: string;
  status: FileActionStatus;
}
