#!/bin/bash
set -e

echo "🗑️  Removing dead code..."
rm -f src/assets/hero.png
rm -f src/lib/stores/canvasStore.ts
rm -f src/lib/shared/LangSwitch.svelte
rm -f src/lib/shared/ThemeToggle.svelte
rm -f src/lib/shared/Navigation.svelte
rm -f src/lib/canvas/types/nodes.ts

echo "📁  Creating directory structure..."
mkdir -p src/core/engine
mkdir -p src/core/memory
mkdir -p src/core/i18n/translations
mkdir -p src/core/theme
mkdir -p src/features/inspector/model
mkdir -p src/features/inspector/ui
mkdir -p src/features/inspector/utils
mkdir -p src/features/canvas/model
mkdir -p src/features/canvas/ui
mkdir -p src/features/canvas/utils
mkdir -p src/features/docs/data
mkdir -p src/features/docs/ui
mkdir -p src/shared/ui
mkdir -p src/shared/stores
mkdir -p src/shared/types
mkdir -p src/app/views

# Fallback function: git mv if possible, otherwise regular mv
safe_mv() {
  git mv "$1" "$2" 2>/dev/null || mv "$1" "$2"
}

echo "🚀  Moving CORE (business logic)..."
safe_mv src/lib/engine/core.ts src/core/engine/runtime.ts
safe_mv src/lib/engine/types.ts src/core/engine/types.ts
safe_mv src/lib/inspector/utils/memory.ts src/core/memory/layout.ts

echo "🌍  Moving i18n & theme..."
safe_mv src/lib/i18n/i18n.svelte.ts src/core/i18n/store.svelte.ts
safe_mv src/lib/i18n/types.ts src/core/i18n/types.ts
safe_mv src/lib/i18n/index.ts src/core/i18n/index.ts
if [ -d src/lib/i18n/translations ]; then
  safe_mv src/lib/i18n/translations src/core/i18n/
fi
safe_mv src/lib/theme/theme.svelte.ts src/core/theme/store.svelte.ts

echo "🎨  Moving CANVAS feature..."
safe_mv src/lib/canvas/state/canvas.svelte.ts src/features/canvas/model/canvas.store.svelte.ts
safe_mv src/lib/canvas/state/canvasBridge.ts src/features/canvas/model/sync.bridge.ts
safe_mv src/lib/canvas/utils/colors.ts src/features/canvas/utils/colors.ts
safe_mv src/lib/canvas/utils/geometry.ts src/features/canvas/utils/geometry.ts
safe_mv src/lib/canvas/CanvasView.svelte src/features/canvas/ui/CanvasView.svelte
safe_mv src/lib/canvas/CanvasViewport.svelte src/features/canvas/ui/CanvasViewport.svelte
safe_mv src/lib/canvas/components/CanvasNode.svelte src/features/canvas/ui/CanvasNode.svelte
safe_mv src/lib/canvas/components/CanvasEdge.svelte src/features/canvas/ui/CanvasEdge.svelte
safe_mv src/lib/canvas/components/CanvasEdgeOverlay.svelte src/features/canvas/ui/CanvasEdgeOverlay.svelte

echo "🔍  Moving INSPECTOR feature..."
safe_mv src/lib/inspector/state/timeline.svelte.ts src/features/inspector/model/timeline.store.svelte.ts
safe_mv src/lib/inspector/InspectorView.svelte src/features/inspector/ui/InspectorView.svelte
safe_mv src/lib/inspector/InspectorPanel.svelte src/features/inspector/ui/InspectorPanel.svelte
for f in src/lib/inspector/components/*.svelte; do
  [ -e "$f" ] && safe_mv "$f" src/features/inspector/ui/
done

echo "📚  Moving DOCS feature..."
safe_mv src/lib/docs/DocsView.svelte src/features/docs/ui/DocsView.svelte
safe_mv src/lib/docs/runtime_docs.ts src/features/docs/data/runtime-docs.ts
safe_mv src/lib/docs/types.ts src/features/docs/data/types.ts

echo "🔗  Moving SHARED resources..."
safe_mv src/lib/types/nodes.ts src/shared/types/nodes.ts
safe_mv src/lib/shared/settingsStore.svelte.ts src/shared/stores/settings.store.svelte.ts
safe_mv src/lib/shared/stackModalStore.svelte.ts src/shared/stores/stack-modal.store.svelte.ts
safe_mv src/lib/shared/SettingsModal.svelte src/shared/ui/SettingsModal.svelte

echo "🖥️  Moving APP shell..."
safe_mv src/lib/workspace/Workspace.svelte src/app/views/Workspace.svelte
safe_mv src/App.svelte src/app/App.svelte

echo "🧹  Cleaning up old empty directories..."
find src/lib -type d -empty -delete 2>/dev/null || true
rm -rf src/lib 2>/dev/null || true
rm -rf src/assets 2>/dev/null || true

echo ""
echo "✅  Restructure complete!"
echo ""
echo "⚠️  NEXT STEPS (manual):"
echo "   1. Update src/main.ts:  import App from './app/App.svelte'"
echo "   2. Update all internal imports inside moved files (IDE find/replace)"
echo "   3. Add path aliases to vite.config.ts (see below)"
echo "   4. Run: npm run check"
echo ""
