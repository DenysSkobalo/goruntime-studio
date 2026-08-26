.PHONY: dev build preview check lint test format format-check clean help

node_modules: package.json package-lock.json
	npm ci

dev: node_modules
	npm run dev

build: node_modules
	npm run build

preview: build
	npm run preview

check: node_modules
	npm run check

lint: node_modules
	npm run lint

test: node_modules
	npm run test:unit

format: node_modules
	npm run format

format-check: node_modules
	npm run format:check

clean:
	rm -rf dist node_modules .svelte-kit .output

help:
	@echo "Available commands:"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build production bundle"
	@echo "  make check        - Run type-checking (svelte-check / tsc)"
	@echo "  make lint         - Run ESLint"
	@echo "  make test         - Run Vitest unit tests"
	@echo "  make format       - Format code using Prettier"
	@echo "  make clean        - Remove build artifacts and dependencies"
