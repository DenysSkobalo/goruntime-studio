<script lang="ts">
  import { X } from 'lucide-svelte';
  import { getNodeAnchor, getBezierParams, computeBezierMidpoint } from '../utils/geometry';

  interface Props {
    edge: any;
    srcNode: any;
    tgtNode: any;
    isSelected: boolean;
    isReconnecting: boolean;
    onRemove: (edgeId: string) => void;
    onStartReconnect: (e: PointerEvent, edgeId: string, end: 'source' | 'target') => void;
  }

  let { edge, srcNode, tgtNode, isSelected, isReconnecting, onRemove, onStartReconnect }: Props = $props();

  let coords = $derived.by(() => {
    if (!srcNode || !tgtNode) return null;
    const srcCenter = { x: srcNode.position.x + 72.5, y: srcNode.position.y + 37 };
    const tgtCenter = { x: tgtNode.position.x + 72.5, y: tgtNode.position.y + 37 };

    const sAnchor = getNodeAnchor(srcNode, tgtCenter);
    const tAnchor = getNodeAnchor(tgtNode, srcCenter);

    return { sx: sAnchor.x, sy: sAnchor.y, sideS: sAnchor.side, tx: tAnchor.x, ty: tAnchor.y, sideT: tAnchor.side };
  });

  let bezierParams = $derived(coords ? getBezierParams(coords) : null);
  let midpoint = $derived(bezierParams ? computeBezierMidpoint(bezierParams) : { x: 0, y: 0 });

  function handleDelete(e: PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    onRemove(edge.id);
  }
</script>

{#if coords && isSelected && !isReconnecting}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    style="left: {coords.sx}px; top: {coords.sy}px;"
    class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-30 flex items-center justify-center"
    onpointerdown={(e) => onStartReconnect(e, edge.id, 'source')}
    title="Drag to reconnect Source"
  >
    <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    style="left: {coords.tx}px; top: {coords.ty}px;"
    class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-30 flex items-center justify-center"
    onpointerdown={(e) => onStartReconnect(e, edge.id, 'target')}
    title="Drag to reconnect Target"
  >
    <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
  </div>

  <button
    onpointerdown={handleDelete}
    style="left: {midpoint.x}px; top: {midpoint.y}px;"
    class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg border border-rose-400 cursor-pointer transition-transform hover:scale-110 z-30"
    title="Delete Connector (Delete/Backspace)"
  >
    <X class="h-3.5 w-3.5" />
  </button>
{/if}
