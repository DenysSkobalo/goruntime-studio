<script lang="ts">
  /**
   * @file src/features/inspector/ui/NodeActionControls.svelte
   * @module features/inspector/ui/NodeActionControls
   *
   * @architecture Runtime Action Executor Controls Component
   * @description Interactive action panel providing trigger buttons to execute Go concurrency primitives
   * (`go func()`, `schedule()`, `ch <- val`, `<-ch`, `close()`) on the selected runtime node.
   *
   * @remarks
   * **Kernel Execution Pipeline:**
   * Invokes step actions directly on `timeline` store, mutating simulation snapshot timeline.
   *
   * @see {@link timeline} Timeline state store executing primitive operations.
   */
  import type { CanvasNode } from '$shared/types/nodes';
  import ActionButton from '$shared/ui/ActionButton.svelte';
  import { timeline } from '../model/timeline.store.svelte';
  import { i18n } from '$core/i18n';
  import { UserPlus, Cpu, Send, Inbox, Ban } from '@lucide/svelte';

  /**
   * Action controls input props contract.
   * ANCHOR: ACTION_CONTROLS_PROPS
   */
  interface Props {
    node: CanvasNode;
    hexAddress: string;
  }

  let { node, hexAddress }: Props = $props();
  /** Input state holding payload string to be sent into channel. ANCHOR: PAYLOAD_INPUT_STATE */
  let payloadInput = $state('hello');
</script>

<!-- ANCHOR: ACTION_CONTROLS_CONTAINER -->
<div
  class="glow-card p-3.5 space-y-3 text-xs border border-zinc-800 bg-zinc-900/60 rounded-xl font-mono"
>
  <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
    {i18n.t('actionExecutor.title')} ({node.label})
  </div>

  {#if node.type === 'goroutine'}
    <!-- ANCHOR: GOROUTINE_ACTIONS -->
    <div class="grid grid-cols-2 gap-2">
      <ActionButton onclick={() => timeline.spawn()} variant="emerald" icon={UserPlus}
        >go func()</ActionButton
      >
      <ActionButton onclick={() => timeline.schedule()} variant="cyan" icon={Cpu}
        >schedule()</ActionButton
      >
    </div>
  {:else if node.type === 'channel'}
    <!-- ANCHOR: CHANNEL_ACTIONS -->
    <div class="space-y-2">
      <!-- ANCHOR: PAYLOAD_INPUT_BOX -->
      <div class="flex items-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
        <span class="text-zinc-500 text-[10px]">{i18n.t('actionExecutor.payload')}:</span>
        <input
          type="text"
          bind:value={payloadInput}
          class="flex-1 bg-transparent text-emerald-400 font-bold text-xs outline-none"
          placeholder="value..."
        />
      </div>

      <div class="grid grid-cols-3 gap-1.5">
        <ActionButton
          onclick={() => timeline.send(payloadInput, hexAddress)}
          variant="emerald"
          icon={Send}>ch &lt;- val</ActionButton
        >
        <ActionButton onclick={() => timeline.receive(hexAddress)} variant="cyan" icon={Inbox}
          >&lt;-ch</ActionButton
        >
        <ActionButton onclick={() => timeline.close(hexAddress)} variant="rose" icon={Ban}
          >close()</ActionButton
        >
      </div>
    </div>
  {/if}
</div>
