# GoRuntime Studio

> Interactive Go Runtime Visualizer & Concurrency Simulator

[![CI](https://github.com/DenysSkobalo/goruntime-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/DenysSkobalo/goruntime-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

GoRuntime Studio is an interactive educational platform that visualizes Go's runtime internals — goroutines, channels, memory allocator (TCMalloc), garbage collector (tri-color mark-sweep), and the GMP scheduler — in real time.

## Features

- **Interactive Canvas**: Drag-and-drop Goroutines (`runtime.g`) and Channels (`runtime.hchan`) with live `sudog` connections
- **Memory Inspection**: Real-time Stack & Heap layout visualization with virtual address mapping
- **GMP Scheduler Topology**: Live Global Run Queue (GRQ) and per-P Local Run Queues (LRQ) monitoring
- **GC Simulation**: Tri-color mark-sweep phases with write barrier visualization
- **Concurrency Analyzer**: Deadlock, race condition, and goroutine leak detection
- **Go Runtime Spec**: Built-in documentation with exact 64-bit struct memory layouts (`runtime.hchan`, `runtime.g`, `runtime.sudog`)
- **Bilingual UI**: English / Ukrainian localization

## Tech Stack

- **Frontend**: Svelte 5 (Runes), TypeScript, Tailwind CSS v4, Vite
- **Kernel**: `goruntime-kernel` — Go runtime simulation engine
- **Testing**: Vitest + jsdom
- **Tooling**: ESLint, Prettier, `svelte-check`

## Quick Start

```bash
# Install dependencies deterministically
npm ci

# Start development server with HMR
make dev

# Or directly
npm run dev
```

## Build & Preview

```bash
# Production build
make build

# Preview production bundle
make preview
```

## Testing & Quality

```bash
# Run unit tests
make test

# Type check (Svelte + TypeScript)
make check

# Lint
make lint

# Format check
make format-check

# Auto-format
make format

# Run all quality checks sequentially
make validate

# Full local CI simulation (validate + build)
make ci
```

## Project Structure

```
├── src/
│   ├── app/              # Root layout, view routing, entry bootstrap
│   ├── core/             # Pure runtime logic (memory, GC, stack, i18n, theme)
│   ├── features/         # Domain-driven UI modules
│   │   ├── canvas/       # 2D interactive viewport, nodes, edges, Bezier paths
│   │   ├── docs/         # Go Runtime Spec documentation viewer
│   │   ├── header/       # Top navigation & simulation controls
│   │   ├── inspector/    # Stack/Heap inspector, timeline store, scheduler topology
│   │   ├── toolbar/      # Tool palette (Goroutine, Channel, Connect)
│   │   └── analyzer/     # Concurrency issue detection banner
│   ├── shared/           # Reusable UI components, types, stores, utilities
│   └── main.ts           # Application entry point
├── public/               # Static assets (icons, favicon)
├── .github/              # Issue templates, PR template, CI workflows
├── Makefile              # Unified build & automation commands
└── vite.config.ts        # Vite + Svelte + Tailwind configuration
```

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a Pull Request.

Key standards:

- **Branching**: All PRs target `develop`, never `main` directly
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)
- **Documentation**: Every file must include a TSDoc File Header and ANCHOR tags
- **Code Quality**: All PRs must pass `make check`, `make lint`, and `make test`

## License

[MIT](LICENSE) © GoRuntime Studio Contributors
