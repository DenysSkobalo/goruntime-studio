<script lang="ts">
  /**
   * @file src/shared/ui/InfoRow.svelte
   * @module shared/ui/InfoRow
   *
   * @architecture Reusable Key-Value Telemetry Row Component
   * @description Micro-component rendering key-value information pairs for memory structure layouts,
   * struct fields, addresses, and internal metadata.
   */

  /**
   * Key-value row props contract.
   * ANCHOR: INFO_ROW_PROPS
   */
  interface Props {
    /** Data field label text string. */
    label: string;
    /** Field value payload. */
    value: string | number | boolean;
    /** Optional Tailwind style overrides for value text. */
    valueClass?: string;
  }

  let { label, value, valueClass = 'text-zinc-200 font-bold' }: Props = $props();
</script>

<!-- ANCHOR: INFO_ROW_CONTAINER -->
<div class="flex justify-between items-center text-xs font-mono">
  <span class="text-zinc-400">{label}:</span>
  <span class={valueClass}>{value}</span>
</div>
