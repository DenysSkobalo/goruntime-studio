# Contributing to GoRuntime Studio

Thank you for your interest in GoRuntime Studio! This document provides guidelines and standards to ensure high code quality and a smooth review process.

---

## Git Branching Model

We use a two-stage integration model:

| Branch                          | Purpose                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `main`                          | Stable production branch. **Direct commits and PRs to `main` are prohibited.**           |
| `develop`                       | Primary testing and integration branch. **All development PRs must target this branch.** |
| `feature/<name>` / `fix/<name>` | Individual developer branches created from `develop`.                                    |

```text
main       -----------------------------------> (Production / Stable Releases)
               ^
               | (after successful testing)
develop    ----+------------+-----------------> (Testing & Integration)
                \          /
feature/*        +-- [PR] -+                    (Developer Feature Branches)
```

### Workflow

1. Create a fresh branch from `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/issue-42-mutex-primitive
   ```

2. Make changes following our [Code Documentation Standards](#code-documentation-standards).

3. Ensure all automated checks pass locally:

   ```bash
   make check
   make lint
   make test
   ```

4. Open a Pull Request targeting `develop` using our PR template.

---

## Commit Standards (Conventional Commits)

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary>
```

### Types

| Type       | Description                           | Example                                            |
| ---------- | ------------------------------------- | -------------------------------------------------- |
| `feat`     | New functionality                     | `feat(memory): implement mcentral span allocation` |
| `fix`      | Bug fix                               | `fix(stack): resolve boundary check calculation`   |
| `docs`     | Documentation changes                 | `docs(gc): add tri-color mark explanation`         |
| `refactor` | Code change without functional change | `refactor(canvas): simplify Bezier path math`      |
| `test`     | Adding or correcting tests            | `test(scheduler): add GRQ starvation test`         |
| `chore`    | Config, CI, dependency changes        | `chore(ci): add GitHub Actions workflow`           |

### Scopes

Common scopes in this project: `memory`, `gc`, `stack`, `scheduler`, `canvas`, `inspector`, `docs`, `i18n`, `theme`, `ci`, `deps`.

---

## Code Documentation Standards

All TypeScript and Svelte files must strictly comply with a three-level documentation standard based on **TSDoc / JSDoc**, plus structural navigation anchors.

### 1. File Header (Module Annotation)

Placed at the beginning of every file. Describes the module's purpose, architectural role, and references to official Go Runtime specification sources.

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

### 2. TSDoc for Methods, Types, and Classes

Every exported class, method, function, type, interface, Svelte `interface Props`, and reactive state (`$state`, `$derived`) must have a TSDoc comment with:

- `@param` — parameter descriptions
- `@returns` — return value description
- `@remarks` — mathematical models or architectural notes
- `@internal` — for implementation details

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

### 3. ANCHOR Tags

Every key data structure, predicate, render block, or reactive effect must be marked with a unique text tag:

```typescript
/** ANCHOR: GO_HEAP_ALLOCATOR */
export class GoHeapAllocator { ... }
```

```svelte
<!-- ANCHOR: STACK_HIGH_BOUNDARY --><div class="flex justify-between items-center...">...</div>
```

**Naming convention**: `SCREAMING_SNAKE_CASE`, descriptive and unique across the project.

---

## Navigation & Global Search

Standardized comments enable instant discovery of any structure via IDE global search:

### Search by ANCHOR Tags

| Search                        | Finds                                          |
| ----------------------------- | ---------------------------------------------- |
| `ANCHOR: GO_HEAP_ALLOCATOR`   | MCache/MCentral/MHeap allocator implementation |
| `ANCHOR: TRICOLOR_MARK_START` | Tri-color GC marking phase                     |
| `ANCHOR: STACK_GUARD_CHECK`   | Stack overflow `stackguard0` check             |
| `ANCHOR: CONNECTOR_PROPS`     | `sudog` connector component props              |
| `ANCHOR: HOTKEY_DISPATCHER`   | Global canvas hotkey handler                   |

### Search by TSDoc Annotations

- `@see {@link https://github.com/golang/go` — all implementations referencing Go Runtime source
- `@module core/memory/*` — core memory subsystem modules

---

## Code Style

- **Formatter**: Prettier with `prettier-plugin-svelte`
- **Linter**: ESLint with `typescript-eslint` and `eslint-plugin-svelte`
- **Indent**: 2 spaces, single quotes, trailing commas
- **Print width**: 100 characters
- **Strict TypeScript**: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`

---

## Testing Requirements

- All new functionality must include unit tests in `.test.ts` files co-located with the source.
- Use Vitest with jsdom environment.
- Tests must include ANCHOR tags for major test cases.

```typescript
/** ANCHOR: TEST_STACK_OVERFLOW */
it('detects stack overflow when SP approaches stackguard0', () => {
  // ...
});
```

---

## Pull Request Checklist

Before submitting a PR, verify:

- [ ] PR targets the `develop` branch
- [ ] Commits follow Conventional Commits
- [ ] All new/modified files have TSDoc File Headers
- [ ] All exported APIs have `@param` and `@returns`
- [ ] All logical blocks have `ANCHOR: <TAG_NAME>` markers
- [ ] `make check` passes (type checking + svelte-check)
- [ ] `make lint` passes (ESLint)
- [ ] `make test` passes (Vitest)
- [ ] `make format-check` passes (Prettier)
- [ ] Documentation updated if external API changed

---

## Questions?

Open a [Discussion](https://github.com/DenysSkobalo/goruntime-studio/discussions) or reach out in the project's communication channels.
