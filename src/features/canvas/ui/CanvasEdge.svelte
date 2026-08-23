<script lang="ts">
  import { getNodeAnchor, getBezierParams, computeBezierPath } from '../utils/geometry';

  interface Props {
    edge: any;
    srcNode: any;
    tgtNode: any;
    isSelected: boolean;
    isReconnecting: boolean;
    onSelect: (edgeId: string) => void;
  }

  let { edge, srcNode, tgtNode, isSelected, isReconnecting, onSelect }: Props = $props();

  let coords = $derived.by(() => {
    if (!srcNode || !tgtNode) return null;
    const srcCenter = { x: srcNode.position.x + 72.5, y: srcNode.position.y + 37 };
    const tgtCenter = { x: tgtNode.position.x + 72.5, y: tgtNode.position.y + 37 };

    const sAnchor = getNodeAnchor(srcNode, tgtCenter);
    const tAnchor = getNodeAnchor(tgtNode, srcCenter);

    return { sx: sAnchor.x, sy: sAnchor.y, sideS: sAnchor.side, tx: tAnchor.x, ty: tAnchor.y, sideT: tAnchor.side };
  });

  let bezierParams = $derived(coords ? getBezierParams(coords) : null);
  let pathD = $derived(bezierParams ? computeBezierPath(bezierParams) : '');
</script>

{#if coords && bezierParams && !isReconnecting}
  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <path
    d={pathD}
    fill="none"
    stroke="transparent"
    stroke-width="20"
    class="pointer-events-auto cursor-pointer"
    role="button"
    tabindex="-1"
    onpointerdown={(e) => { e.stopPropagation(); onSelect(edge.id); }}
  />

  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <path
    d={pathD}
    fill="none"
    stroke={isSelected ? '#ef4444' : '#f59e0b'}
    stroke-width={isSelected ? "3.5" : "2.5"}
    stroke-linecap="round"
    stroke-dasharray="6 6"
    class="pointer-events-auto cursor-pointer {isSelected ? '' : 'animate-data-flow'}"
    role="button"
    tabindex="-1"
    onpointerdown={(e) => { e.stopPropagation(); onSelect(edge.id); }}
  />
{/if}

<style>
  @keyframes data-flow {
    from { stroke-dashoffset: 24; }
    to { stroke-dashoffset: 0; }
  }
  .animate-data-flow {
    animation: data-flow 1.2s linear infinite;
  }
</style>
