<script lang="ts">
  import { getEdgeColor } from '../utils/colors';
  import {
    getNodeAnchor,
    getBezierParams,
    computeBezierPath,
  } from '../utils/geometry';

  interface Props {
    edge: any;
    srcNode: any;
    tgtNode: any;
    isSelected: boolean;
    isReconnecting: boolean;
    onSelect: (edgeId: string) => void;
  }

  let {
    edge,
    srcNode,
    tgtNode,
    isSelected,
    isReconnecting,
    onSelect,
  }: Props = $props();

  let coords = $derived.by(() => {
    if (!srcNode || !tgtNode) return null;
    const srcCenter = { x: srcNode.position.x + 70, y: srcNode.position.y + 40 };
    const tgtCenter = { x: tgtNode.position.x + 70, y: tgtNode.position.y + 40 };

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

  let bezierParams = $derived(coords ? getBezierParams(coords) : null);
  let pathD = $derived(bezierParams ? computeBezierPath(bezierParams) : '');
  let color = $derived(getEdgeColor(edge.kind, isSelected));

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      onSelect(edge.id);
    }
  }
</script>

{#if coords && bezierParams && !isReconnecting}
  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <path
    d={pathD}
    fill="none"
    stroke="transparent"
    stroke-width="16"
    class="pointer-events-auto cursor-pointer"
    role="button"
    tabindex="-1"
    aria-label="Select edge {edge.id}"
    onclick={(e) => { e.stopPropagation(); onSelect(edge.id); }}
    onkeydown={handleKey}
  />
  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <path
    d={pathD}
    fill="none"
    stroke={color}
    stroke-width={isSelected ? "3.5" : "2.5"}
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-dasharray={edge.kind === 'data_flow' ? '0' : '5 4'}
    opacity={isSelected ? "1" : "0.85"}
    filter={isSelected ? "url(#edge-glow)" : "none"}
    class="pointer-events-auto cursor-pointer"
    role="button"
    tabindex="-1"
    aria-label="Edge {edge.id}"
    onclick={(e) => { e.stopPropagation(); onSelect(edge.id); }}
    onkeydown={handleKey}
  />
{/if}