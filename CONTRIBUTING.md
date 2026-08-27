# File Naming and Project Commenting Standards

## Comment Standard Description and Contributor Instructions

All files in the project's codebase are written in strict compliance with a documentation standard based on **TSDoc / JSDoc**, as well as special navigation anchors (ANCHOR tags).

---

### 1. Comment Structure in Every File

Every TypeScript / Svelte file must contain the following 3 levels of commenting:

#### A. File Header (File Header Module Annotation)

Placed at the beginning of every file. Describes the module's purpose, its architectural role, and references to official Go Runtime specification sources.

```typescript
/**
 * @file src/core/memory/allocator.ts
 * @module core/memory/allocator
 *
 * @architecture TCMalloc (Thread-Caching Malloc) Derivative & Heap Facade Architecture
 * @description High-performance Go runtime memory allocation simulator implementing a three-tier hierarchy...
 *
 * @see {@link https://github.com/golang/go/blob/master/src/runtime/malloc.go Go Memory Allocator Implementation}
 */
```

#### B. Documentation of Methods, Interfaces, and Classes (TSDoc Methods & Types)

Every class, method, function, type, and interface is documented with parameters (`@param`), return values (`@returns`), mathematical models (`@remarks`), and internal constraints (`@internal`).

```typescript
/**
 * Evaluates function call preamble stack overflow conditions.
 *
 * @remarks
 * Evaluates if $\text{SP} - \text{nextFrameSize} < \text{stackguard0}$.
 *
 * @param g - Target Goroutine state instance.
 * @param nextFrameSize - Requested byte size of upcoming frame call.
 * @returns Object detailing overflow boolean state and current total stack size.
 */
```

#### C. Structural and Block Navigation Anchors (ANCHOR: <TAG_NAME>)

Every key data structure, predicate, JSX/Svelte render block, or reactive effect is marked with a unique text tag `ANCHOR: <TAG_NAME>`.

```typescript
// Example in TypeScript/Svelte code:
/** ANCHOR: GO_HEAP_ALLOCATOR */
export class GoHeapAllocator { ... }
```

```svelte
<!-- ANCHOR: STACK_HIGH_BOUNDARY -->
<div class="flex justify-between items-center...">...</div>
```

---

### 2. Contributor Instructions: How to Write Comments

When adding a new file or modifying an existing one, the contributor is required to:

- **Add a File Header**: Specify the exact file path in the `@file` field, the module name in `@module`, a brief description in `@description`, and references to Go Runtime sources in `@see`.

- **Document Types and Functions**: All exported functions, Svelte 5 props (`interface Props`), and reactive states (`$state`, `$derived`) must have a TSDoc comment.

- **Mark ANCHOR Tags**: Every logical block (method, template section, test case) must have a marker `ANCHOR: <UNIQUE_NAME>`.

---

### 3. Using Comments and ANCHOR Tags for Project-wide Search

Using standardized TSDoc comments and ANCHOR tags allows instant discovery of any structure, module, or specific UI fragment via global search in the IDE (Neovim / VS Code / GoLand / WebStorm):

#### Search by ANCHOR Tags (Quick Jump)

To find a specific algorithm, memory element, or UI block, perform a code search by the keyword `ANCHOR:` or the tag name:

**Search for Go memory implementation:**

- `ANCHOR: GO_HEAP_ALLOCATOR` — MCache/MCentral/MHeap allocator implementation (`src/core/memory/allocator.ts`).
- `ANCHOR: TRICOLOR_MARK_START` — Tricolor GC marking (`src/core/memory/gc.ts`).
- `ANCHOR: STACK_GUARD_CHECK` — Stack overflow check `stackguard0` (`src/core/memory/stack.ts`).

**Search for inspector interfaces and specifications:**

- `ANCHOR: CONNECTOR_PROPS` — wait list `sudog` component props (`ConnectorInternals.svelte`).
- `ANCHOR: RUNTIME_DOCS_REGISTRY` — Sticky registry of Go specifications (`runtime-docs.ts`).
- `ANCHOR: HOTKEY_DISPATCHER` — Global canvas hotkey handler (`CanvasViewport.svelte`).

#### Search by TSDoc Annotations and References (`@see`, `@module`)

- Search for all implementations referencing the original Go Runtime source code: search for the string `@see {@link https://github.com/golang/go`.
- Search for core modules: search for the string `@module core/memory/*`.
