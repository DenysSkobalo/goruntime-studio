import type { BaseCanvasNode, CanvasEdge } from '../types/nodes';
import { createInitialSnapshot } from '../../engine/core';
import type { RuntimeSnapshot } from '../../engine/types';

class CanvasStore {
  nodes = $state<BaseCanvasNode[]>([]);
  edges = $state<CanvasEdge[]>([]);
  selectedNodeId = $state<string | null>(null);

  // Трансляція стану візуального графа у RuntimeSnapshot для engine/core.ts
  compileToSnapshot(): RuntimeSnapshot {
    const snapshot = createInitialSnapshot(2);
    // Логіка мапінгу вузлів графа на фізичні структури GMP / hchan
    return snapshot;
  }
}

export const canvasStore = new CanvasStore();
