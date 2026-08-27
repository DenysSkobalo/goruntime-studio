<script lang="ts">
  /**
   * @file src/features/canvas/ui/CanvasViewport.svelte
   * @module features/canvas/ui/CanvasViewport
   *
   * @architecture Interactive 2D Workspace Viewport Engine
   * @description Coordinates canvas interactions, node dragging, connector creation/re-routing,
   * global keyboard shortcut handling, and real-time Bezier path synthesis.
   *
   * @remarks
   * **Frame-Lock Throttling Strategy:**
   * Utilizes `requestAnimationFrame` with an `isTicking` flag during pointer movement to cap state updates to display refresh rates,
   * avoiding DOM paint queue starvation and lag during continuous mouse dragging.
   *
   * @see {@link canvasStore} State store holding active nodes, edges, and active tools.
   */
  import type { CanvasNode, CanvasNodeType } from '$shared/types/nodes';
  import CanvasNodeComponent from './CanvasNode.svelte';
  import { canvasStore, validateConnection } from '../model/canvas.store.svelte';
  import CanvasEdge from './CanvasEdge.svelte';
  import CanvasEdgeOverlay from './CanvasEdgeOverlay.svelte';
  import { getToolBannerColor } from '../utils/colors';
  import { stackModalStore } from '$shared/stores/stack-modal.store.svelte';
  import { getNodeAnchor } from '../utils/geometry';
  import { computeBezierPath, getBezierParams } from '../utils/svg-path';

  let viewportRef = $state<HTMLDivElement | null>(null);

  // Node dragging internal state
  let isDraggingNode = $state(false);
  let draggedNodeId = $state<string | null>(null);
  let dragOffset = { x: 0, y: 0 };

  // Connection and re-routing state
  let connectingSourceId = $state<string | null>(null);
  let reconnectingEdgeId = $state<string | null>(null);
  let reconnectingEnd = $state<'source' | 'target' | null>(null);
  let hoveredNodeId = $state<string | null>(null);
  let mousePos = $state({ x: 0, y: 0 });

  /**
   * Frame-Lock flag preventing high-frequency `pointermove` event flooding.
   * ANCHOR: FRAME_LOCK_STATE
   */
  let isTicking = false;
  let latestPointerCoords = { x: 0, y: 0 };

  /**
   * Converts client window screen space coordinates to canvas viewport relative space.
   */
  function getCanvasCoordinates(clientX: number, clientY: number) {
    if (!viewportRef) return { x: clientX, y: clientY };
    const rect = viewportRef.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  /**
   * Handles canvas background click events for node instantiation or selection clear.
   * ANCHOR: CANVAS_POINTER_DOWN
   */
  function handleCanvasPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const activeTool = canvasStore.activeTool;

    if (activeTool !== 'pointer' && activeTool !== 'connect') {
      canvasStore.addNode(activeTool as CanvasNodeType, {
        x: Math.max(10, coords.x - 72.5),
        y: Math.max(10, coords.y - 37),
      });
      canvasStore.setTool('pointer');
      return;
    }

    canvasStore.selectNode(null);
    canvasStore.selectEdge(null);
    connectingSourceId = null;
    reconnectingEdgeId = null;
    reconnectingEnd = null;
  }

  /**
   * Initiates node dragging or connection linking on node pointer press.
   * ANCHOR: NODE_POINTER_DOWN
   */
  function handleNodePointerDown(e: PointerEvent, node: CanvasNode) {
    if (e.button !== 0) return;
    e.stopPropagation();

    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    if (reconnectingEdgeId && reconnectingEnd) {
      if (reconnectingEnd === 'source') {
        canvasStore.reconnectEdge(reconnectingEdgeId, node.id, undefined);
      } else if (reconnectingEnd === 'target') {
        canvasStore.reconnectEdge(reconnectingEdgeId, undefined, node.id);
      }
      reconnectingEdgeId = null;
      reconnectingEnd = null;
      return;
    }

    if (canvasStore.activeTool === 'connect') {
      if (connectingSourceId && connectingSourceId !== node.id) {
        const check = validateConnection(
          canvasStore.nodes,
          canvasStore.edges,
          connectingSourceId,
          node.id,
        );
        if (check.valid) {
          canvasStore.addEdge(connectingSourceId, node.id);
        }
        connectingSourceId = null;
        canvasStore.setTool('pointer');
      } else {
        connectingSourceId = node.id;
      }
      return;
    }

    canvasStore.selectNode(node.id);
    isDraggingNode = true;
    draggedNodeId = node.id;
    dragOffset = { x: coords.x - node.position.x, y: coords.y - node.position.y };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
  }

  /**
   * Throttled window pointer move event listener updating drag position and active hover targets.
   * ANCHOR: WINDOW_POINTER_MOVE
   */
  function handleWindowPointerMove(e: PointerEvent) {
    latestPointerCoords = getCanvasCoordinates(e.clientX, e.clientY);

    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(() => {
        mousePos = latestPointerCoords;

        if (isDraggingNode && draggedNodeId) {
          const nextX = Math.max(10, latestPointerCoords.x - dragOffset.x);
          const nextY = Math.max(10, latestPointerCoords.y - dragOffset.y);
          canvasStore.updatePosition(draggedNodeId, { x: nextX, y: nextY });
        }

        if (reconnectingEdgeId || canvasStore.activeTool === 'connect') {
          const elem = document.elementFromPoint(e.clientX, e.clientY);
          const nodeEl = elem?.closest('[data-node-id]');
          hoveredNodeId = nodeEl ? nodeEl.getAttribute('data-node-id') : null;
        }

        isTicking = false;
      });
    }
  }

  /**
   * Finalizes node dragging or connection re-routing on pointer release.
   */
  function handleWindowPointerUp(e: PointerEvent) {
    if (reconnectingEdgeId && reconnectingEnd) {
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const targetNodeId =
        elem?.closest('[data-node-id]')?.getAttribute('data-node-id') || hoveredNodeId;

      if (targetNodeId) {
        if (reconnectingEnd === 'source') {
          canvasStore.reconnectEdge(reconnectingEdgeId, targetNodeId, undefined);
        } else if (reconnectingEnd === 'target') {
          canvasStore.reconnectEdge(reconnectingEdgeId, undefined, targetNodeId);
        }
      }
      reconnectingEdgeId = null;
      reconnectingEnd = null;
    }

    if (isDraggingNode) {
      isDraggingNode = false;
      draggedNodeId = null;
    }

    window.removeEventListener('pointermove', handleWindowPointerMove);
    window.removeEventListener('pointerup', handleWindowPointerUp);
  }

  function handleViewportPointerMove(e: PointerEvent) {
    if (!isDraggingNode) {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      mousePos = coords;

      const targetEl = (e.target as HTMLElement).closest('[data-node-id]') as HTMLElement | null;
      hoveredNodeId = targetEl ? targetEl.getAttribute('data-node-id') : null;
    }
  }

  /**
   * Global hotkey keyboard event handler.
   *
   * ANCHOR: HOTKEY_DISPATCHER
   *
   * @remarks
   * **Why text input bypass check is required:**
   * Prevents workspace hotkey actions (Delete, V, G, C, L, P) from triggering while users are typing inside input fields,
   * textareas, or content-editable elements in inspector panels.
   */
  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    // Ignore keypresses during system shortcuts (Cmd+C, Ctrl+V, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    if (e.code === 'Escape') {
      e.preventDefault();
      canvasStore.setTool('pointer');
      connectingSourceId = null;
      reconnectingEdgeId = null;
      reconnectingEnd = null;
      canvasStore.selectNode(null);
      canvasStore.selectEdge(null);
      return;
    }

    if (e.code === 'KeyV') {
      e.preventDefault();
      canvasStore.setTool('pointer');
    } else if (e.code === 'KeyG') {
      e.preventDefault();
      canvasStore.setTool(canvasStore.activeTool === 'goroutine' ? 'pointer' : 'goroutine');
    } else if (e.code === 'KeyC') {
      e.preventDefault();
      canvasStore.setTool(canvasStore.activeTool === 'channel' ? 'pointer' : 'channel');
    } else if (e.code === 'KeyL') {
      e.preventDefault();
      canvasStore.setTool(canvasStore.activeTool === 'connect' ? 'pointer' : 'connect');
    } else if (e.code === 'KeyP') {
      e.preventDefault();
      const selectedNode = canvasStore.getNode(canvasStore.selectedNodeId);
      const goid = selectedNode && selectedNode.type === 'goroutine' ? selectedNode.goid : 1;
      stackModalStore.open(goid);
    } else if (
      e.code === 'Delete' ||
      e.code === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Backspace'
    ) {
      e.preventDefault();
      if (canvasStore.selectedNodeId) {
        canvasStore.removeNode(canvasStore.selectedNodeId);
      } else if (canvasStore.selectedEdgeId) {
        canvasStore.removeEdge(canvasStore.selectedEdgeId);
      }
    }
  }

  function startReconnect(e: PointerEvent, edgeId: string, end: 'source' | 'target') {
    e.stopPropagation();
    reconnectingEdgeId = edgeId;
    reconnectingEnd = end;
    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
  }

  let activeConnectionState = $derived.by(() => {
    if (canvasStore.activeTool === 'connect' && connectingSourceId) {
      const srcNode = canvasStore.getNode(connectingSourceId);
      if (!srcNode) return null;

      let isHoverValid = false;
      if (hoveredNodeId && hoveredNodeId !== connectingSourceId) {
        isHoverValid = validateConnection(
          canvasStore.nodes,
          canvasStore.edges,
          connectingSourceId,
          hoveredNodeId,
        ).valid;
      }
      return { srcNode, isHoverValid };
    }
    return null;
  });

  let activeReconnectState = $derived.by(() => {
    if (reconnectingEdgeId && reconnectingEnd) {
      const edge = canvasStore.getEdge(reconnectingEdgeId);
      if (!edge) return null;
      const fixedNodeId = reconnectingEnd === 'source' ? edge.target : edge.source;
      const fixedNode = canvasStore.getNode(fixedNodeId);
      if (!fixedNode) return null;

      let isHoverValid = false;
      if (hoveredNodeId && hoveredNodeId !== fixedNodeId) {
        isHoverValid = validateConnection(
          canvasStore.nodes,
          canvasStore.edges,
          reconnectingEnd === 'source' ? hoveredNodeId : fixedNodeId,
          reconnectingEnd === 'source' ? fixedNodeId : hoveredNodeId,
          edge.id,
        ).valid;
      }
      return { fixedNode, isHoverValid };
    }
    return null;
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={viewportRef}
  class="canvas-viewport relative w-full h-full bg-[#09090b] overflow-hidden select-none"
  role="region"
  tabindex="0"
  onpointerdown={handleCanvasPointerDown}
  onpointermove={handleViewportPointerMove}
>
  {#if canvasStore.activeTool !== 'pointer'}
    <div
      class="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full text-xs font-mono text-white font-semibold shadow-xl backdrop-blur-md border border-white/10 flex items-center gap-2 pointer-events-none {getToolBannerColor(
        canvasStore.activeTool,
      )}"
    >
      <span
        >Tool: <strong>{canvasStore.activeTool.toUpperCase()}</strong> (Press ESC to cancel)</span
      >
    </div>
  {/if}

  <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
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

    {#if activeConnectionState}
      {@const sAnchor = getNodeAnchor(activeConnectionState.srcNode, mousePos)}
      {@const bezierParams = getBezierParams({
        sx: sAnchor.x,
        sy: sAnchor.y,
        sideS: sAnchor.side,
        tx: mousePos.x,
        ty: mousePos.y,
        sideT: sAnchor.side === 'left' ? 'right' : 'left',
      })}
      <path
        d={computeBezierPath(bezierParams)}
        fill="none"
        stroke={activeConnectionState.isHoverValid ? '#f59e0b' : '#ef4444'}
        stroke-width={activeConnectionState.isHoverValid ? '3' : '2'}
        stroke-dasharray="6 6"
      />
    {/if}

    {#if activeReconnectState}
      {@const fAnchor = getNodeAnchor(activeReconnectState.fixedNode, mousePos)}
      {@const bezierParams = getBezierParams({
        sx: fAnchor.x,
        sy: fAnchor.y,
        sideS: fAnchor.side,
        tx: mousePos.x,
        ty: mousePos.y,
        sideT: fAnchor.side === 'left' ? 'right' : 'left',
      })}
      <path
        d={computeBezierPath(bezierParams)}
        fill="none"
        stroke={activeReconnectState.isHoverValid ? '#f59e0b' : '#ef4444'}
        stroke-width="3"
        stroke-dasharray="4 4"
      />
    {/if}
  </svg>

  <div class="absolute inset-0 pointer-events-none z-10">
    {#each canvasStore.nodes as node (node.id)}
      {@const isSelected = canvasStore.selectedNodeId === node.id}
      {@const isConnecting = canvasStore.activeTool === 'connect' && connectingSourceId !== null}
      {@const isReconnecting = reconnectingEdgeId !== null}

      {@const isValidTarget =
        (isConnecting || isReconnecting) &&
        node.id !== (connectingSourceId || reconnectingEdgeId) &&
        (isConnecting
          ? validateConnection(canvasStore.nodes, canvasStore.edges, connectingSourceId!, node.id)
              .valid
          : isReconnecting
            ? validateConnection(
                canvasStore.nodes,
                canvasStore.edges,
                reconnectingEnd === 'source'
                  ? canvasStore.getEdge(reconnectingEdgeId!)!.target
                  : canvasStore.getEdge(reconnectingEdgeId!)!.source,
                node.id,
                reconnectingEdgeId!,
              ).valid
            : false)}

      {@const isInvalidTarget =
        (isConnecting || isReconnecting) &&
        node.id !== (connectingSourceId || reconnectingEdgeId) &&
        !isValidTarget}

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="pointer-events-auto inline-block">
        <CanvasNodeComponent
          {node}
          {isSelected}
          isConnectSource={connectingSourceId === node.id}
          {isValidTarget}
          {isInvalidTarget}
          onPointerDown={(e: PointerEvent) => handleNodePointerDown(e, node)}
          onPointerUp={() => {}}
        />
      </div>
    {/each}

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
          onRemove={(id) => canvasStore.removeEdge(id)}
          onStartReconnect={startReconnect}
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
