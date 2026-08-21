<script lang="ts">
    import type { CanvasNode, CanvasNodeType } from "$lib/types/nodes";
    import CanvasNodeComponent from "./CanvasNode.svelte";
    import { i18n } from "$core/i18n";
    import { canvasStore, isValidConnection } from "../model/canvas.store.svelte";
    import CanvasEdge from "./CanvasEdge.svelte";
    import { getToolBannerColor } from "../utils/colors";
    import CanvasEdgeOverlay from "./CanvasEdgeOverlay.svelte";

  let viewportRef = $state<HTMLDivElement | null>(null);

  let isDraggingNode = $state(false);
  let draggedNodeId = $state<string | null>(null);
  let dragOffset = $state({ x: 0, y: 0 });

  let connectingSourceId = $state<string | null>(null);

  let reconnectingEdgeId = $state<string | null>(null);
  let reconnectingEnd = $state<'source' | 'target' | null>(null);

  let mousePos = $state({ x: 0, y: 0 });

  // Автоматичне скидання лінії з'єднання при зміні активного інструмента
  $effect(() => {
    if (canvasStore.activeTool !== 'connect') {
      connectingSourceId = null;
      reconnectingEdgeId = null;
      reconnectingEnd = null;
    }
  });

  let cursorClass = $derived.by(() => {
    if (canvasStore.activeTool === 'pointer') {
      return isDraggingNode ? 'cursor-grabbing' : 'cursor-grab';
    }
    return 'cursor-crosshair';
  });

  function getCanvasCoordinates(e: PointerEvent): { x: number; y: number } {
    if (!viewportRef) return { x: e.clientX, y: e.clientY };
    const rect = viewportRef.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handleCanvasPointerDown(e: PointerEvent) {
    const coords = getCanvasCoordinates(e);
    const activeTool = canvasStore.activeTool;

    const isNodeType = ['goroutine', 'channel', 'mutex', 'waitgroup', 'select'].includes(activeTool);
    if (isNodeType) {
      canvasStore.addNode(
        activeTool as CanvasNodeType,
        { x: Math.max(10, coords.x - 70), y: Math.max(10, coords.y - 40) }
      );
      canvasStore.setTool('pointer');
      return;
    }

    canvasStore.selectNode(null);
    canvasStore.selectEdge(null);
    connectingSourceId = null;
  }

  function handleNodePointerDown(e: PointerEvent, node: CanvasNode) {
    e.stopPropagation();
    const coords = getCanvasCoordinates(e);

    if (canvasStore.activeTool === 'connect') {
      if (connectingSourceId && connectingSourceId !== node.id) {
        const srcNode = canvasStore.getNode(connectingSourceId);
        if (srcNode && isValidConnection(srcNode.type, node.type)) {
          canvasStore.addEdge(connectingSourceId, node.id);
        }
        connectingSourceId = null;
      } else {
        connectingSourceId = node.id;
      }
      return;
    }

    if (['goroutine', 'channel', 'mutex', 'waitgroup', 'select'].includes(canvasStore.activeTool)) {
      return;
    }

    canvasStore.selectNode(node.id);
    isDraggingNode = true;
    draggedNodeId = node.id;
    dragOffset = {
      x: coords.x - node.position.x,
      y: coords.y - node.position.y,
    };
  }

  function handleNodePointerUp(node: CanvasNode) {
    if (connectingSourceId && connectingSourceId !== node.id) {
      const srcNode = canvasStore.getNode(connectingSourceId);
      if (srcNode && isValidConnection(srcNode.type, node.type)) {
        canvasStore.addEdge(connectingSourceId, node.id);
      }
      connectingSourceId = null;
    }

    if (reconnectingEdgeId && reconnectingEnd) {
      canvasStore.reconnectEdge(reconnectingEdgeId, reconnectingEnd, node.id);
      reconnectingEdgeId = null;
      reconnectingEnd = null;
    }
  }

  function handlePointerMove(e: PointerEvent) {
    const coords = getCanvasCoordinates(e);
    mousePos = coords;

    if (isDraggingNode && draggedNodeId) {
      const newX = Math.max(10, coords.x - dragOffset.x);
      const newY = Math.max(10, coords.y - dragOffset.y);
      canvasStore.updatePosition(draggedNodeId, { x: newX, y: newY });
    }
  }

  function handleGlobalPointerUp(e: PointerEvent) {
    if (reconnectingEdgeId && reconnectingEnd) {
      const targetEl = document.elementFromPoint(e.clientX, e.clientY);
      const nodeEl = targetEl?.closest('[data-node-id]');
      if (nodeEl) {
        const nodeId = nodeEl.getAttribute('data-node-id');
        if (nodeId) {
          canvasStore.reconnectEdge(reconnectingEdgeId, reconnectingEnd, nodeId);
        }
      }
      reconnectingEdgeId = null;
      reconnectingEnd = null;
    }
    isDraggingNode = false;
    draggedNodeId = null;
  }

  function handleStartReconnect(e: PointerEvent, edgeId: string, end: 'source' | 'target') {
    e.stopPropagation();
    reconnectingEdgeId = edgeId;
    reconnectingEnd = end;
  }

  function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();
    const code = event.code;

    if (key === '1' || code === 'Digit1' || code === 'Numpad1' || key === 'v' || code === 'KeyV') {
      canvasStore.setTool('pointer');
    } else if (key === '2' || code === 'Digit2' || code === 'Numpad2' || key === 'g' || code === 'KeyG') {
      canvasStore.setTool('goroutine');
    } else if (key === '3' || code === 'Digit3' || code === 'Numpad3' || key === 'c' || code === 'KeyC') {
      canvasStore.setTool('channel');
    } else if (key === '4' || code === 'Digit4' || code === 'Numpad4' || key === 'm' || code === 'KeyM') {
      canvasStore.setTool('mutex');
    } else if (key === '5' || code === 'Digit5' || code === 'Numpad5' || key === 'w' || code === 'KeyW') {
      canvasStore.setTool('waitgroup');
    } else if (key === '6' || code === 'Digit6' || code === 'Numpad6' || key === 's' || code === 'KeyS') {
      canvasStore.setTool('select');
    } else if (key === '7' || code === 'Digit7' || code === 'Numpad7' || key === 'l' || code === 'KeyL') {
      canvasStore.setTool('connect');
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (canvasStore.selectedNodeId) {
        canvasStore.removeNode(canvasStore.selectedNodeId);
      } else if (canvasStore.selectedEdgeId) {
        canvasStore.removeEdge(canvasStore.selectedEdgeId);
      }
    } else if (event.key === 'Escape') {
      canvasStore.selectNode(null);
      canvasStore.selectEdge(null);
      connectingSourceId = null;
      reconnectingEdgeId = null;
      reconnectingEnd = null;
      canvasStore.setTool('pointer');
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} onpointerup={handleGlobalPointerUp} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={viewportRef}
  class="canvas-viewport relative w-full h-full bg-[#09090b] overflow-hidden select-none {cursorClass}"
  role="region"
  aria-label={i18n.t('canvas.aria.viewport')}
  tabindex="0"
  onpointerdown={handleCanvasPointerDown}
  onpointermove={handlePointerMove}
>
  {#if canvasStore.activeTool !== 'pointer'}
    <div
      class="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full text-xs font-mono text-white font-semibold shadow-xl backdrop-blur-md border border-white/10 flex items-center gap-2 pointer-events-none animate-fade-in {getToolBannerColor(
        canvasStore.activeTool
      )}"
    >
      <span>{i18n.t('canvas.tool.label')}: <strong>{canvasStore.activeTool.toUpperCase()}</strong> — {i18n.t('canvas.tool.instruction')}</span>
    </div>
  {/if}

  <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
    <defs>
      <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {#each canvasStore.edges as edge (edge.id)}
      {@const srcNode = canvasStore.getNode(edge.source)}
      {@const tgtNode = canvasStore.getNode(edge.target)}
      {#if srcNode && tgtNode}
        <CanvasEdge
          {edge}
          {srcNode}
          {tgtNode}
          isSelected={canvasStore.selectedEdgeId === edge.id}
          isReconnecting={reconnectingEdgeId === edge.id}
          onSelect={(id) => canvasStore.selectEdge(id)}
        />
      {/if}
    {/each}

    {#if connectingSourceId}
      {@const src = canvasStore.getNode(connectingSourceId)}
      {#if src}
        {@const srcPt = { x: src.position.x + 70, y: src.position.y + 40 }}
        <line
          x1={srcPt.x}
          y1={srcPt.y}
          x2={mousePos.x}
          y2={mousePos.y}
          stroke="#f43f5e"
          stroke-width="2"
          stroke-dasharray="4 4"
          class="pointer-events-none"
        />
      {/if}
    {/if}

    {#if reconnectingEdgeId && reconnectingEnd}
      {@const activeEdge = canvasStore.getEdge(reconnectingEdgeId)}
      {#if activeEdge}
        {@const anchorNodeId = reconnectingEnd === 'source' ? activeEdge.target : activeEdge.source}
        {@const anchorNode = canvasStore.getNode(anchorNodeId)}
        {#if anchorNode}
          {@const anchorPt = { x: anchorNode.position.x + 70, y: anchorNode.position.y + 40 }}
          <line
            x1={anchorPt.x}
            y1={anchorPt.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="#f43f5e"
            stroke-width="2"
            stroke-dasharray="4 4"
            class="pointer-events-none"
          />
        {/if}
      {/if}
    {/if}
  </svg>

  <div class="absolute inset-0 pointer-events-none z-10">
    {#each canvasStore.nodes as node (node.id)}
      {@const isSelected = canvasStore.selectedNodeId === node.id}
      {@const isConnectSource = connectingSourceId === node.id}
      {@const srcNode = connectingSourceId ? canvasStore.getNode(connectingSourceId) : null}
      {@const isInvalidTarget = srcNode ? !isValidConnection(srcNode.type, node.type) : false}

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="pointer-events-auto inline-block"
        onpointerup={() => handleNodePointerUp(node)}
      >
        <CanvasNodeComponent 
          {node}
          {isSelected}
          {isConnectSource}
          {isInvalidTarget}
          onPointerDown={(e: PointerEvent) => handleNodePointerDown(e, node)}
        />
      </div>
    {/each}
  </div>

  <div class="absolute inset-0 pointer-events-none z-20">
    {#each canvasStore.edges as edge (edge.id)}
      {@const srcNode = canvasStore.getNode(edge.source)}
      {@const tgtNode = canvasStore.getNode(edge.target)}
      {#if srcNode && tgtNode}
        <CanvasEdgeOverlay
          {edge}
          {srcNode}
          {tgtNode}
          isSelected={canvasStore.selectedEdgeId === edge.id}
          isReconnecting={reconnectingEdgeId === edge.id}
          onStartReconnect={handleStartReconnect}
          onRemove={(id) => canvasStore.removeEdge(id)}
        />
      {/if}
    {/each}
  </div>
</div>

<style>
  .canvas-viewport {
    background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
  }
</style>