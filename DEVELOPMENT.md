# Development Guide

> Deep-dive architectural guide for GoRuntime Studio contributors.

---

## Architecture Overview

GoRuntime Studio follows a **layered architecture** separating pure runtime logic from UI concerns:

```
┌─────────────────────────────────────────────┐
│  app/          │ Root layout, view router   │
├─────────────────────────────────────────────┤
│  features/     │ Domain-driven UI modules   │
│   ├── canvas/  │ 2D viewport, nodes, edges  │
│   ├── docs/    │ Runtime spec viewer        │
│   ├── header/  │ Navigation & controls      │
│   ├── inspector│ Stack/Heap inspector       │
│   ├── toolbar/ │ Tool palette               │
│   └── analyzer │ Concurrency diagnostics    │
├─────────────────────────────────────────────┤
│  core/         │ Pure runtime logic         │
│   ├── memory/  │ Allocator, GC, Stack       │
│   ├── i18n/    │ Localization engine        │
│   └── theme/   │ Dark/light/system themes   │
├─────────────────────────────────────────────┤
│  shared/       │ Reusable UI & utilities    │
│   ├── ui/      │ Modal, Badge, Button...    │
│   ├── types/   │ Canvas node contracts      │
│   ├── stores/  │ Global Svelte 5 stores     │
│   ├── lib/     │ Navigation helpers         │
│   └── config/  │ External links             │
└─────────────────────────────────────────────┘
```

---

## Adding a New Runtime Primitive

To add a new primitive (e.g., `sync.Mutex`):

1. **Update type system** (`src/shared/types/nodes.ts`):
   - Add to `CanvasNodeType` union
   - Create `MutexNode` interface extending `BaseCanvasNode`
   - Update `CanvasNode` union
   - Add type guards (`isMutexNode`)

2. **Update canvas store** (`src/features/canvas/model/canvas.store.svelte.ts`):
   - Add node creation logic in `addNode()`
   - Add validation rules in `validateConnection()`
   - Add lookup maps if needed

3. **Update UI components**:
   - `CanvasNode.svelte` — render node shape & status
   - `Toolbar.svelte` — add tool palette entry
   - `NodeInternals.svelte` — inspector panel fields
   - `NodeActionControls.svelte` — action buttons

4. **Update docs** (`src/features/docs/data/runtime-docs.ts`):
   - Add `RuntimeDoc` entry with memory layout

5. **Update colors** (`src/features/canvas/utils/colors.ts`):
   - Add tool banner color mapping

6. **Update i18n** (`src/core/i18n/locales/en.ts` & `uk.ts`):
   - Add translation keys

---

## ANCHOR Tag Naming Conventions

- **Classes / Singletons**: `ANCHOR: GO_HEAP_ALLOCATOR`
- **Methods**: `ANCHOR: STACK_GUARD_CHECK`
- **UI Sections**: `ANCHOR: STACK_HIGH_BOUNDARY`
- **Test Cases**: `ANCHOR: TEST_STACK_OVERFLOW`
- **Derived State**: `ANCHOR: GOROUTINE_STACK_DERIVED`
- **Event Handlers**: `ANCHOR: CANVAS_POINTER_DOWN`

Rules:

- Use `SCREAMING_SNAKE_CASE`
- Must be unique across the entire codebase
- Place directly above the target block
- Prefix test anchors with `TEST_`

---

## State Management Patterns

We use **Svelte 5 Runes** (`$state`, `$derived`, `$derived.by`, `$effect`) exclusively:

```typescript
class TimelineStore {
  snapshots = $state<RuntimeSnapshot[]>([]);
  currentIndex = $state<number>(0);

  currentSnapshot = $derived(this.snapshots[this.currentIndex] ?? null);
  canStepForward = $derived(this.currentIndex < this.snapshots.length - 1);
}
```

Avoid Svelte 4 stores (`writable`, `readable`) in new code.

---

## Memory Address Simulation

Virtual addresses follow Go 64-bit conventions:

- **Heap arena base**: `0x00c000000000`
- **Page size**: `8192` bytes (8 KiB)
- **Stack min size**: `2048` bytes (2 KiB)

All address formatting goes through `$core/memory/layout.ts`:

```typescript
formatHex(0x00c000000000n); // => "0x00c000000000"
```

---

## Kernel Bridge

The UI syncs with `goruntime-kernel` via snapshot immutability:

```typescript
// src/features/canvas/model/sync.bridge.ts
export function syncCanvasWithSnapshot(snapshot: RuntimeSnapshot | null): void {
  // Maps kernel goroutine/channel state to canvas nodes
}
```

Never mutate kernel snapshots directly from UI code.

---

## Testing Conventions

- Co-locate tests: `foo.ts` → `foo.test.ts`
- Use `describe` / `it` blocks from Vitest
- Mock kernel types when needed
- Always include an ANCHOR tag for the test block

---

## Useful Commands

```bash
# Run all quality checks sequentially
make validate

# Full local CI simulation
make ci

# Watch mode for tests
npm run test:watch

# Dev server with HMR
make dev
```
