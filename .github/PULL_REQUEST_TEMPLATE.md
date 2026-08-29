## Description

<!-- Briefly describe what changes are being made and what problem they solve -->

Linked Issues: Closes #<!-- issue number -->

---

## Target Branch

- [ ] PR is directed to the **`develop`** branch (not `main` directly)

---

## TSDoc & ANCHOR Standards Check

Please ensure all new / modified TypeScript / Svelte files comply with our documentation standards:

- [ ] **File Header**: Module annotation present at the top of each file (`@file`, `@module`, `@architecture`, `@description`, `@see`).
- [ ] **TSDoc**: All exported types, functions, classes, interfaces, Svelte props (`interface Props`), and reactive states (`$state`, `$derived`) are documented with `@param`, `@returns`, `@remarks`.
- [ ] **ANCHOR Tags**: Every new logical block, method, or UI component is marked with a unique `ANCHOR: <TAG_NAME>` tag.

---

## Pre-flight Checklist

- [ ] Commits follow **Conventional Commits** (`feat:`, `fix:`, `docs:`, etc.).
- [ ] Local unit tests and linter pass without errors (`make test` / `make lint`).
- [ ] New functionality is covered by tests.
- [ ] Documentation updated (if external API or spec changed).
