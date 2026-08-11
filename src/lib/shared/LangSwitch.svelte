<script lang="ts">
  import { i18n } from '../i18n/i18n.svelte';

  const langs = [
    { code: 'en' as const, label: 'EN' },
    { code: 'uk' as const, label: 'UA' },
  ];
</script>

<div class="flex items-center gap-1 rounded-lg border border-default bg-elevated p-1">
  <span class="sr-only">{i18n.t('nav.language')}</span>
  {#each langs as lang}
    <button
      onclick={() => i18n.setLang(lang.code)}
      class="rounded-md px-2 py-1 text-[11px] font-bold font-mono transition-all
        {i18n.lang === lang.code
          ? 'bg-surface text-accent-primary shadow-sm'
          : 'text-muted hover:text-default'}"
    >
      {lang.label}
    </button>
  {/each}
</div>
