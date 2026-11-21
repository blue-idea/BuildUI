export type FileActionStatus = 'writing' | 'completed' | 'idle';

export interface FileActionItem {
  id: string;
  filename: string;
  path: string;
  status: FileActionStatus;
}
