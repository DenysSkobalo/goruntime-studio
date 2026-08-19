<script lang="ts">
  import { canvasStore, isValidConnection } from './state/canvas.svelte';
  import { Network } from 'lucide-svelte';
  import CanvasNode from './components/CanvasNode.svelte';
  import CanvasEdge from './components/CanvasEdge.svelte';
  import CanvasEdgeOverlay from './components/CanvasEdgeOverlay.svelte';
  import { getToolBannerColor } from './utils/colors';
  import { getNodeAnchor, getBezierParams } from './utils/geometry';

  let containerRef: HTMLDivElement;
  let draggingId: string | null = null;
  let dragOffset = { x: 0, y: 0 };
  
  let connectSourceId = $state<string | null>(null);
  let isConnectDragging = $state(false);
  let connectMousePos = $state({ x: 0, y: 0 });

  let reconnectEdgeId = $state<string | null>(null);
  let reconnectEnd = $state<'source' | 'target' | null>(null);

  let hoveredNodeId = $state<string | null>(null);

  function getEventPos(e: PointerEvent) {
    const rect = containerRef.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function detectHoveredNode(e: PointerEvent) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const nodeEl = el?.closest('[data-node-id]');
    hoveredNodeId = nodeEl?.getAttribute('data-node-id') ?? null;
  }

  function onNodePointerDown(e: PointerEvent, nodeId: string) {
    e.stopPropagation();

    if (canvasStore.activeTool === 'connect') {
      if (!connectSourceId) {
        connectSourceId = nodeId;
        isConnectDragging = true;
        connectMousePos = getEventPos(e);
        canvasStore.selectNode(nodeId);
        containerRef.setPointerCapture(e.pointerId);
      } else if (connectSourceId === nodeId) {
        connectSourceId = null;
        isConnectDragging = false;
        canvasStore.selectNode(null);
      } else {
        canvasStore.addEdge(connectSourceId, nodeId);
        connectSourceId = null;
        isConnectDragging = false;
        canvasStore.selectNode(null);
      }
      return;
    }

    if (canvasStore.activeTool === 'pointer') {
      canvasStore.selectNode(nodeId);
      draggingId = nodeId;
      const node = canvasStore.getNode(nodeId);
      if (!node) return;
      const pos = getEventPos(e);
      dragOffset = { x: pos.x - node.position.x, y: pos.y - node.position.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      const rect = containerRef.getBoundingClientRect();
      const x = e.clientX - rect.left - 70;
      const y = e.clientY - rect.top - 40;
      canvasStore.addNode(canvasStore.activeTool, { x, y });
    }
  }

  function onPointerMove(e: PointerEvent) {
    detectHoveredNode(e);

    if (isConnectDragging || reconnectEdgeId) {
      connectMousePos = getEventPos(e);
      return;
    }
    if (!draggingId) return;
    const pos = getEventPos(e);
    canvasStore.updatePosition(draggingId, {
      x: pos.x - dragOffset.x,
      y: pos.y - dragOffset.y,
    });
  }

  function onPointerUp(e: PointerEvent) {
    if (isConnectDragging) {
      isConnectDragging = false;
      detectHoveredNode(e);

      if (hoveredNodeId && connectSourceId && hoveredNodeId !== connectSourceId) {
        canvasStore.addEdge(connectSourceId, hoveredNodeId);
        connectSourceId = null;
        canvasStore.selectNode(null);
      }

      try { containerRef.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      return;
    }

    if (reconnectEdgeId && reconnectEnd) {
      detectHoveredNode(e);
      if (hoveredNodeId && isCurrentConnectionValid) {
        canvasStore.reconnectEdge(reconnectEdgeId, reconnectEnd, hoveredNodeId);
      }
      reconnectEdgeId = null;
      reconnectEnd = null;
      try { containerRef.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      return;
    }

    draggingId = null;
  }

  function onBackgroundClick(e: MouseEvent) {
    if (canvasStore.activeTool === 'connect') {
      if (!connectSourceId) canvasStore.setTool('pointer');
      return;
    }
    if (canvasStore.activeTool !== 'pointer') {
      const rect = containerRef.getBoundingClientRect();
      const x = e.clientX - rect.left - 70;
      const y = e.clientY - rect.top - 40;
      canvasStore.addNode(canvasStore.activeTool, { x, y });
      return;
    }
    canvasStore.selectNode(null);
    canvasStore.selectEdge(null);
  }

  function handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (e.key === 'Escape') {
      connectSourceId = null;
      isConnectDragging = false;
      reconnectEdgeId = null;
      reconnectEnd = null;
      if (canvasStore.activeTool === 'connect') canvasStore.setTool('pointer');
      canvasStore.selectNode(null);
      canvasStore.selectEdge(null);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (canvasStore.selectedEdgeId) {
        canvasStore.removeEdge(canvasStore.selectedEdgeId);
      } else if (canvasStore.selectedNodeId) {
        canvasStore.removeNode(canvasStore.selectedNodeId);
      }
    } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      switch (e.code) {
        case 'Digit1': case 'KeyV': canvasStore.setTool('pointer'); break;
        case 'Digit2': case 'KeyG': canvasStore.setTool('goroutine'); break;
        case 'Digit3': case 'KeyC': canvasStore.setTool('channel'); break;
        case 'Digit4': case 'KeyM': canvasStore.setTool('mutex'); break;
        case 'Digit5': case 'KeyW': canvasStore.setTool('waitgroup'); break;
        case 'Digit6': case 'KeyS': canvasStore.setTool('select'); break;
        case 'Digit7': case 'KeyL': canvasStore.setTool('connect'); break;
      }
    }
  }

  function startReconnect(e: PointerEvent, edgeId: string, end: 'source' | 'target') {
    e.stopPropagation();
    reconnectEdgeId = edgeId;
    reconnectEnd = end;
    connectMousePos = getEventPos(e);
    containerRef.setPointerCapture(e.pointerId);
  }

  let hoveredTargetNode = $derived(hoveredNodeId ? canvasStore.getNode(hoveredNodeId) : null);

  let isCurrentConnectionValid = $derived.by(() => {
    if (!hoveredTargetNode) return true;
    if (connectSourceId) {
      const src = canvasStore.getNode(connectSourceId);
      if (!src || src.id === hoveredTargetNode.id) return false;
      return isValidConnection(src.type, hoveredTargetNode.type);
    }
    if (reconnectEdgeId && reconnectEnd) {
      const edge = canvasStore.edges.find(e => e.id === reconnectEdgeId);
      if (!edge) return true;
      const fixedNodeId = reconnectEnd === 'target' ? edge.sourceNodeId : edge.targetNodeId;
      const fixedNode = canvasStore.getNode(fixedNodeId);
      if (!fixedNode || fixedNode.id === hoveredTargetNode.id) return false;

      const srcType = reconnectEnd === 'target' ? fixedNode.type : hoveredTargetNode.type;
      const tgtType = reconnectEnd === 'target' ? hoveredTargetNode.type : fixedNode.type;
      return isValidConnection(srcType, tgtType);
    }
    return true;
  });

  let activeSourceTypeLabel = $derived.by(() => {
    if (connectSourceId) return canvasStore.getNode(connectSourceId)?.type;
    if (reconnectEdgeId && reconnectEnd) {
      const edge = canvasStore.edges.find(e => e.id === reconnectEdgeId);
      if (!edge) return null;
      const fixedNodeId = reconnectEnd === 'target' ? edge.sourceNodeId : edge.targetNodeId;
      return canvasStore.getNode(fixedNodeId)?.type;
    }
    return null;
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  bind:this={containerRef}
  class="relative w-full h-full overflow-hidden cursor-crosshair"
  class:cursor-grab={canvasStore.activeTool === 'pointer'}
  class:active:cursor-grabbing={canvasStore.activeTool === 'pointer'}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onclick={onBackgroundClick}
  role="application"
  aria-label="Canvas viewport"
>
  <div
    class="absolute inset-0 pointer-events-none"
    style="background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 24px 24px; z-index: 0;"
  ></div>

  <!-- SVG Layer -->
  <svg class="absolute inset-0 w-full h-full pointer-events-none" style="z-index: 1; overflow: visible;">
    <defs>
      <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {#each canvasStore.edges as edge (edge.id)}
      <CanvasEdge
        {edge}
        srcNode={canvasStore.getNode(edge.sourceNodeId)}
        tgtNode={canvasStore.getNode(edge.targetNodeId)}
        isSelected={canvasStore.selectedEdgeId === edge.id}
        isReconnecting={reconnectEdgeId === edge.id}
        onSelect={(id) => canvasStore.selectEdge(id)}
      />
    {/each}

    <!-- Ghost Line during Connect / Reconnect -->
    {#if (isConnectDragging && connectSourceId) || (reconnectEdgeId && reconnectEnd)}
      {@const srcNode = isConnectDragging
        ? canvasStore.getNode(connectSourceId!)
        : (() => {
            const edge = canvasStore.edges.find(e => e.id === reconnectEdgeId);
            if (!edge) return null;
            const fixedId = reconnectEnd === 'target' ? edge.sourceNodeId : edge.targetNodeId;
            return canvasStore.getNode(fixedId);
          })()
      }
      {#if srcNode}
        {@const tgtPoint = hoveredTargetNode
          ? getNodeAnchor(hoveredTargetNode, { x: srcNode.position.x + 70, y: srcNode.position.y + 40 })
          : { x: connectMousePos.x, y: connectMousePos.y, side: 'pointer' as const }
        }
        {@const srcPoint = getNodeAnchor(srcNode, tgtPoint)}
        {@const ghostParams = getBezierParams({
            sx: srcPoint.x, sy: srcPoint.y, sideS: srcPoint.side,
            tx: tgtPoint.x, ty: tgtPoint.y, sideT: tgtPoint.side
          })
        }
        <path
          d="M {ghostParams.sx} {ghostParams.sy} C {ghostParams.cx1} {ghostParams.cy1}, {ghostParams.cx2} {ghostParams.cy2}, {ghostParams.tx} {ghostParams.ty}"
          fill="none"
          stroke={isCurrentConnectionValid ? "#f43f5e" : "#ef4444"}
          stroke-width="3"
          stroke-dasharray="6 4"
          stroke-linecap="round"
          opacity="0.95"
        />
        <circle cx={ghostParams.tx} cy={ghostParams.ty} r="6" fill={isCurrentConnectionValid ? "#f43f5e" : "#ef4444"} />
      {/if}
    {/if}
  </svg>

  <!-- HTML Edge Controls Overlay Layer (z-index: 25) -->
  {#each canvasStore.edges as edge (edge.id)}
    <CanvasEdgeOverlay
      {edge}
      srcNode={canvasStore.getNode(edge.sourceNodeId)}
      tgtNode={canvasStore.getNode(edge.targetNodeId)}
      isSelected={canvasStore.selectedEdgeId === edge.id}
      isReconnecting={reconnectEdgeId === edge.id}
      onStartReconnect={startReconnect}
      onRemove={(id) => canvasStore.removeEdge(id)}
    />
  {/each}

  <!-- Canvas Nodes -->
  {#each canvasStore.nodes as node (node.id)}
    <CanvasNode
      {node}
      isSelected={canvasStore.selectedNodeId === node.id}
      isConnectSource={connectSourceId === node.id}
      isInvalidTarget={hoveredNodeId === node.id && (isConnectDragging || reconnectEdgeId !== null) && !isCurrentConnectionValid}
      onPointerDown={(e) => onNodePointerDown(e, node.id)}
    />
  {/each}

  {#if canvasStore.nodes.length === 0}
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <Network class="h-12 w-12 text-zinc-700 mb-3 animate-pulse" />
      <h3 class="font-mono text-base font-bold text-zinc-500">Canvas is Empty</h3>
      <p class="font-mono text-xs text-zinc-600 max-w-md text-center mt-1">
        Select a tool from the left palette or press 1-7 to add a node.
      </p>
    </div>
  {/if}

  <!-- Status / Tool Banner Overlay -->
  {#if (isConnectDragging || reconnectEdgeId) && hoveredTargetNode && !isCurrentConnectionValid}
    <div
      style="left: {connectMousePos.x}px; top: {connectMousePos.y - 32}px; z-index: 50;"
      class="absolute -translate-x-1/2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-[11px] font-mono font-bold pointer-events-none shadow-xl flex items-center gap-1.5 animate-bounce"
    >
      <span>🚫 ⛔</span>
      <span>Неможливо з'єднати {activeSourceTypeLabel} та {hoveredTargetNode.type}!</span>
    </div>
  {:else if canvasStore.activeTool === 'connect'}
    <div class="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-rose-600/90 text-white text-[11px] font-mono font-bold pointer-events-none z-20 animate-fade-in shadow-lg">
      {#if !connectSourceId}
        Click a node to set source
      {:else}
        Drag to another node to connect
      {/if}
    </div>
  {:else if canvasStore.activeTool !== 'pointer'}
    <div class="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full {getToolBannerColor(canvasStore.activeTool)} text-white text-[11px] font-mono font-bold pointer-events-none z-20 animate-fade-in shadow-lg">
      Click to place {canvasStore.activeTool}
    </div>
  {/if}
</div>