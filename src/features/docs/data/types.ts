/**
 * @file src/features/docs/data/types.ts
 * @module features/docs/data/types
 *
 * @architecture Documentation Data Contract Specifications
 * @description Type definitions representing localized string dictionaries, memory layout table rows,
 * struct byte offsets, invariants, and source repository references for Go runtime primitives.
 */

/**
 * Localized string mapping contract for Ukrainian (`uk`) and English (`en`).
 * ANCHOR: LOCALIZED_STRING_TYPE
 */
export interface LocalizedString {
  uk: string;
  en: string;
}

/**
 * Single field descriptor row within a Go struct memory layout table.
 * ANCHOR: MEMORY_LAYOUT_ROW_TYPE
 */
export interface MemoryLayoutRow {
  /** Hexadecimal and decimal byte offset representation (e.g. `'0x00 (0)'`). */
  offset: string;
  /** Go runtime struct field name symbol (e.g. `'qcount'`, `'buf'`, `'lock'`). */
  field: string;
  /** Go primitive or pointer data type (e.g. `'uint'`, `'unsafe.Pointer'`, `'mutex (8B)'`). */
  type: string;
  /** Localized architectural note explaining field usage and invariants. */
  note: LocalizedString;
}

/**
 * Complete specification documentation model for a Go runtime primitive structure.
 * ANCHOR: RUNTIME_DOC_TYPE
 */
export interface RuntimeDoc {
  /** Unique primitive identifier key (e.g., `'channel'`, `'goroutine'`, `'sudog'`). */
  id: string;
  /** Localized human-readable title. */
  title: LocalizedString;
  /** Fully qualified Go runtime struct type name (e.g. `'runtime.hchan'`, `'runtime.g'`). */
  structName: string;
  /** Total struct byte allocation size on 64-bit target architectures (AMD64 / ARM64). */
  sizeBytes64Bit: number;
  /** Comprehensive localized description of primitive functionality. */
  description: LocalizedString;
  /** Essential execution invariants enforced by runtime logic. */
  keyInvariants: LocalizedString[];
  /** Upstream Go source repository file linkage. */
  source: {
    file: string;
    repoUrl: string;
  };
  /** Array of memory layout row descriptors ordered by byte offset. */
  memoryLayout: MemoryLayoutRow[];
}
