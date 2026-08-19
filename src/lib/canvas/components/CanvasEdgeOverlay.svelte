<script lang="ts">
  import { X } from 'lucide-svelte';
  import {
    getNodeAnchor,
    getBezierParams,
    computeBezierMidpoint,
  } from '../utils/geometry';

  interface Props {
    edge: any;
    srcNode: any;
    tgtNode: any;
    isSelected: boolean;
    isReconnecting: boolean;
    onStartReconnect: (e: PointerEvent, edgeId: string, end: 'source' | 'target') => void;
    onRemove: (edgeId: string) => void;
  }

  let {
    edge,
    srcNode,
    tgtNode,
    isSelected,
    isReconnecting,
    onStartReconnect,
    onRemove,
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
  let midpoint = $derived(bezierParams ? computeBezierMidpoint(bezierParams) : { x: 0, y: 0 });
</script>

{#if coords && isSelected && !isReconnecting}
  <!-- Source Handle -->
  <button
    onpointerdown={(e) => onStartReconnect(e, edge.id, 'source')}
    style="left: {coords.sx}px; top: {coords.sy}px; z-index: 25;"
    class="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-rose-500 shadow-md hover:scale-125 cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform"
    title="Reconnect source"
  >
    <div class="w-2 h-2 rounded-full bg-rose-500"></div>
  </button>

  <!-- Target Handle -->
  <button
    onpointerdown={(e) => onStartReconnect(e, edge.id, 'target')}
    style="left: {coords.tx}px; top: {coords.ty}px; z-index: 25;"
    class="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-rose-500 shadow-md hover:scale-125 cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform"
    title="Reconnect target"
  >
    <div class="w-2 h-2 rounded-full bg-rose-500"></div>
  </button>

  <!-- Delete Connector Button -->
  <button
    onclick={(e) => { e.stopPropagation(); onRemove(edge.id); }}
    style="left: {midpoint.x}px; top: {midpoint.y}px; z-index: 25;"
    class="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition border border-white"
    title="Delete connector"
  >
    <X class="h-3.5 w-3.5" />
  </button>
{/if}