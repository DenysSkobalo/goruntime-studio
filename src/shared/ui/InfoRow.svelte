<script lang="ts">
  interface Props {
    label: string;
    value: string | number | boolean;
    valueClass?: string;
  }

  let { label, value, valueClass = 'text-zinc-200 font-bold' }: Props = $props();
</script>

<div class="flex justify-between items-center text-xs font-mono">
  <span class="text-zinc-400">{label}:</span>
  <span class={valueClass}>{value}</span>
</div>
