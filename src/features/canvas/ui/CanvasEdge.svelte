<script lang="ts">
  /**
   * @file src/features/canvas/ui/CanvasEdge.svelte
   * @module features/canvas/ui/CanvasEdge
   *
   * @architecture Dynamic Vector Path Connector Component
   * @description SVG Bezier curve rendering data flow channels, channel queues (`hchan`), and `sudog` links
   * between Goroutines and Channel nodes.
   *
   * @remarks
   * **Visual Hierarchy & Hit Area Scaling:**
   * Includes an invisible wide transparent path (`stroke-width="20"`) overlaid above the visual dashed path to maximize pointer hit-testing area,
   * making fine vector connectors easily clickable without precise pixel positioning.
   *
   * @see {@link computeBezierPath} Cubic Bezier curve path generator.
   */
  import type { CanvasEdge, CanvasNode } from '$shared/types/nodes';
  import { getNodeAnchor } from '../utils/geometry';
  import { getBezierParams, computeBezierPath } from '../utils/svg-path';

  interface Props {
    edge: CanvasEdge;
    srcNode: CanvasNode;
    tgtNode: CanvasNode;
    isSelected: boolean;
    isReconnecting: boolean;
    onSelect: (edgeId: string) => void;
  }

  let { edge, srcNode, tgtNode, isSelected, isReconnecting, onSelect }: Props = $props();

  /**
   * Dynamically calculates boundary anchor coordinates for source and target nodes.
   * ANCHOR: EDGE_ANCHOR_COORDS
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

  /** Bezier control points calculation. ANCHOR: BEZIER_PARAMS_DERIVED */
  let bezierParams = $derived(coords ? getBezierParams(coords) : null);
  /** SVG path attribute string `d="M ... C ..."`. ANCHOR: PATH_D_DERIVED */
  let pathD = $derived(bezierParams ? computeBezierPath(bezierParams) : '');
</script>

{#if coords && bezierParams && !isReconnecting}
  <!-- 
    ANCHOR: INVISIBLE_HIT_AREA
    Wide transparent stroke (20px) providing accessible touch/click target without cluttering visual aesthetic.
  -->
  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <path
    d={pathD}
    fill="none"
    stroke="transparent"
    stroke-width="20"
    class="pointer-events-auto cursor-pointer"
    role="button"
    tabindex="-1"
    onpointerdown={(e) => {
      e.stopPropagation();
      onSelect(edge.id);
    }}
  />

  <!-- 
    ANCHOR: VISUAL_DASHED_STROKE
    Animated dashed path simulating active message channel data streaming or waiting sudog queue.
  -->
  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <path
    d={pathD}
    fill="none"
    stroke={isSelected ? '#ef4444' : '#f59e0b'}
    stroke-width={isSelected ? '3.5' : '2.5'}
    stroke-linecap="round"
    stroke-dasharray="6 6"
    class="pointer-events-auto cursor-pointer {isSelected ? '' : 'animate-data-flow'}"
    role="button"
    tabindex="-1"
    onpointerdown={(e) => {
      e.stopPropagation();
      onSelect(edge.id);
    }}
  />
{/if}

<style>
  @keyframes data-flow {
    from {
      stroke-dashoffset: 24;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  .animate-data-flow {
    animation: data-flow 1.2s linear infinite;
  }
</style>
