# ==============================================================================
# @file Makefile
# @architecture Project Build & Automation Lifecycle Controller
# @description Unified command interface for local development, CI/CD verification pipelines,
# static code analysis, code formatting, and production artifact compilation.
# ==============================================================================

.DEFAULT_GOAL := help
.SHELLFLAGS   := -eu -c
SHELL         := /bin/bash

# Configuration Variables
NODE_MODULES  := node_modules
BUILD_DIR     := dist
CACHE_DIRS    := .svelte-kit .output .vite coverage

# Declare non-file targets to prevent name collisions with physical files
.PHONY: init dev build preview check lint lint-fix test test-coverage test-ui format format-check check-anchors fix validate ci clean help

# ------------------------------------------------------------------------------
# DEPENDENCY MANAGEMENT
# ------------------------------------------------------------------------------

## Install dependencies deterministically and initialize Git hooks
init: $(NODE_MODULES)
	@echo "--> Project environment successfully initialized!"

$(NODE_MODULES): package.json package-lock.json
	@echo "--> Installing dependencies via npm ci..."
	npm ci
	@touch $(NODE_MODULES)

# ------------------------------------------------------------------------------
# DEVELOPMENT PIPELINE
# ------------------------------------------------------------------------------

## Start local Vite development server with Hot Module Replacement (HMR)
dev: $(NODE_MODULES)
	npm run dev

## Build optimized production application bundle
build: $(NODE_MODULES)
	npm run build

## Preview compiled production build locally
preview: build
	npm run preview

# ------------------------------------------------------------------------------
# QUALITY ASSURANCE & TESTING
# ------------------------------------------------------------------------------

## Execute static type checking across Svelte and TypeScript files (svelte-check / tsc)
check: $(NODE_MODULES)
	npm run check

## Run ESLint static code analysis
lint: $(NODE_MODULES)
	npm run lint

## Automatically fix ESLint warnings and formatting errors
lint-fix: $(NODE_MODULES)
	npm run lint:fix

## Verify uniqueness of ANCHOR tags across source code
check-anchors: $(NODE_MODULES)
	npm run check:anchors

## Execute Vitest unit test suite
test: $(NODE_MODULES)
	npm run test:unit

## Run Vitest tests with code coverage report generation
test-coverage: $(NODE_MODULES)
	npm run test:coverage

## Launch interactive Vitest graphical UI interface
test-ui: $(NODE_MODULES)
	npm run test:ui

## Verify code formatting compliance with Prettier rules without mutating files
format-check: $(NODE_MODULES)
	npm run format:check

## Format source code base using Prettier
format: $(NODE_MODULES)
	npm run format

## Automatically fix code styling (runs Prettier format and ESLint fix)
fix: format lint-fix
	@echo "--> Code formatting and lint issues automatically resolved!"

## Run all quality assurance checks sequentially (check, lint, format-check, check-anchors, test)
validate: check lint format-check check-anchors test
	@echo "--> All quality assurance checks passed successfully!"

## Run full local CI pipeline simulation (validate + build)
ci: validate build
	@echo "--> Full local CI simulation passed successfully!"

# ------------------------------------------------------------------------------
# MAINTENANCE & HELP
# ------------------------------------------------------------------------------

## Purge build artifacts, dependencies, and compiler cache directories
clean:
	@echo "--> Purging build artifacts, node_modules, and internal caches..."
	rm -rf $(BUILD_DIR) $(NODE_MODULES) $(CACHE_DIRS)

## Display self-documented list of available make targets
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available Targets:"
	@awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 1, index($$1, ":")-1); \
			helpText = substr(lastLine, RSTART + 3, RLENGTH - 3); \
			printf "  \033[36m%-15s\033[0m %s\n", helpCommand, helpText; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)
