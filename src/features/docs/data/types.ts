import type { Lang } from '$core/i18n/types';

export interface LocalizedString {
  uk: string;
  en: string;
}

export interface MemoryLayoutRow {
  offset: string;
  field: string;
  type: string;
  note: LocalizedString;
}

export interface RuntimeDoc {
  id: string;
  title: LocalizedString;
  structName: string;
  sizeBytes64Bit: number;
  description: LocalizedString;
  keyInvariants: LocalizedString[];
  source: {
    file: string;
    repoUrl: string;
  };
  memoryLayout: MemoryLayoutRow[];
}
