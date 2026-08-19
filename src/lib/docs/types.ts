import type { CanvasNodeType } from '../types/nodes';

export interface GoSourceRef {
  file: string;
  repoUrl: string;
  specUrl?: string;
  lines?: string;
}

export interface RuntimeDocEntry {
  id: CanvasNodeType | 'sudog';
  title: string;
  structName: string;
  sizeBytes64Bit: number;
  source: GoSourceRef;
  description: string;
  keyInvariants: string[];
  memoryLayout: Array<{ offset: string; field: string; type: string; note: string }>;
}