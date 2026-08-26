<script lang="ts">
  import { X } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    subtitle?: string;
    icon?: any;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
    onClose: () => void;
    children: Snippet;
  }

  let {
    isOpen,
    title,
    subtitle,
    icon: Icon,
    maxWidth = 'md',
    onClose,
    children,
  }: Props = $props();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  function handleBackdropPointerDown(e: PointerEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-mono select-none"
    role="dialog"
    aria-modal="true"
    onpointerdown={handleBackdropPointerDown}
  >
    <div
      class="relative w-full {maxWidthClasses[maxWidth]} bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <header
        class="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/80 shrink-0"
      >
        <div class="flex items-center gap-3">
          {#if Icon}
            <div
              class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0"
            >
              <Icon class="w-5 h-5" />
            </div>
          {/if}
          <div>
            <h2 class="text-sm font-bold text-white uppercase tracking-wider font-sans">
              {title}
            </h2>
            {#if subtitle}
              <p class="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>
            {/if}
          </div>
        </div>
        <button
          onclick={onClose}
          class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer"
          aria-label="Close"
        >
          <X class="w-4 h-4" />
        </button>
      </header>

      <div class="p-5 overflow-y-auto flex-1">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
