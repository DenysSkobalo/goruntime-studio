<script lang="ts">
  import Navigation from './lib/shared/Navigation.svelte';
  import InspectorView from './lib/inspector/InspectorView.svelte';
  import CanvasView from './lib/canvas/CanvasView.svelte';

  type Mode = 'inspector' | 'canvas';
  let activeMode = $state<Mode>('inspector');
</script>

<main class="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
  <Navigation bind:activeMode />

  <div class="flex-1 p-6">
    {#if activeMode === 'inspector'}
      <InspectorView />
    {:else}
      <CanvasView />
    {/if}
  </div>
</main>
