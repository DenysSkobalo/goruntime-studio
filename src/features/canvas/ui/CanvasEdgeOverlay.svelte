<script lang="ts">
  /**
   * @file src/features/canvas/ui/CanvasEdgeOverlay.svelte
   * @module features/canvas/ui/CanvasEdgeOverlay
   *
   * @architecture Interactive Connector Controls Overlay
   * @description Renders interactive control handles on canvas edges for edge deletion and dynamic
   * source/target connector re-routing.
   *
   * @remarks
   * Midpoint coordinates for deletion action button are derived by evaluating the parametric Cubic Bezier equation at $t = 0.5$.
   *
   * @see {@link computeBezierMidpoint} Computes $t = 0.5$ parametric Bezier midpoint.
   */
  import { X } from '@lucide/svelte';
  import type { CanvasEdge, CanvasNode } from '$shared/types/nodes';
  import { getNodeAnchor } from '../utils/geometry';
  import { getBezierParams, computeBezierMidpoint } from '../utils/svg-path';

  interface Props {
    edge: CanvasEdge;
    srcNode: CanvasNode;
    tgtNode: CanvasNode;
    isSelected: boolean;
    isReconnecting: boolean;
    onRemove: (edgeId: string) => void;
    onStartReconnect: (e: PointerEvent, edgeId: string, end: 'source' | 'target') => void;
  }

  let { edge, srcNode, tgtNode, isSelected, isReconnecting, onRemove, onStartReconnect }: Props =
    $props();

  /**
   * Calculates anchor boundary points for edge handles.
   * ANCHOR: OVERLAY_ANCHORS
   */
  let coords = $derived.by(() => {
    if (!srcNode || !tgtNode) return null;
    const srcCenter = { x: srcNode.position.x + 72.5, y: srcNode.position.y + 37 };
    const tgtCenter = { x: tgtNode.position.x + 72.5, y: tgtNode.position.y + 37 };

    const sAnchor = getNodeAnchor(srcNode, tgtCenter);
    const tAnchor = getNodeAnchor(tgtNode, srcCenter);

    return {
      sx: sAnchor.x,
      sy: sAnchor.y,
      sideS: sAnchor.side,
      tx: tAnchor.x,
      ty: tAnchor.y,
      sideT: tAnchor.side,
    };
  });

  /** Bezier parameters calculation. */
  let bezierParams = $derived(coords ? getBezierParams(coords) : null);
  /** Parametric curve midpoint ($t = 0.5$) for positioning delete button. ANCHOR: OVERLAY_MIDPOINT */
  let midpoint = $derived(bezierParams ? computeBezierMidpoint(bezierParams) : { x: 0, y: 0 });

  function handleDelete(e: PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    onRemove(edge.id);
  }
</script>

{#if coords && isSelected && !isReconnecting}
  <!-- 
    ANCHOR: RECONNECT_SOURCE_HANDLE
    Draggable handle for re-linking source node connection.
  -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    style="left: {coords.sx}px; top: {coords.sy}px;"
    class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-30 flex items-center justify-center"
    onpointerdown={(e) => onStartReconnect(e, edge.id, 'source')}
    title="Drag to reconnect Source"
  >
    <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
  </div>

  <!-- 
    ANCHOR: RECONNECT_TARGET_HANDLE
    Draggable handle for re-linking target node connection.
  -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    style="left: {coords.tx}px; top: {coords.ty}px;"
    class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-30 flex items-center justify-center"
    onpointerdown={(e) => onStartReconnect(e, edge.id, 'target')}
    title="Drag to reconnect Target"
  >
    <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
  </div>

  <!-- 
    ANCHOR: DELETE_CONNECTOR_BUTTON
    Positioned at Bezier curve parametric midpoint.
  -->
  <button
    onpointerdown={handleDelete}
    style="left: {midpoint.x}px; top: {midpoint.y}px;"
    class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg border border-rose-400 cursor-pointer transition-transform hover:scale-110 z-30"
    title="Delete Connector (Delete/Backspace)"
  >
    <X class="h-3.5 w-3.5" />
  </button>
{/if}
