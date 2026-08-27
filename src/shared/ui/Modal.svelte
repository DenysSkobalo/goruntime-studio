<script lang="ts">
  /**
   * @file src/shared/ui/Modal.svelte
   * @module shared/ui/Modal
   *
   * @architecture Reusable Accessible Modal Dialog Component
   * @description Modal dialog overlay supporting backdrop blur, keydown dismissal (`Escape` key),
   * backdrop pointer clicks, dynamic header iconography, title/subtitle metadata, and flexible content snippets.
   *
   * @remarks
   * **Accessibility & Focus Management:**
   * Sets `role="dialog"` and `aria-modal="true"`. Intercepts `Escape` key events globally via `<svelte:window>`
   * to provide intuitive modal dismissal across all screen sizes.
   */
  import { X } from '@lucide/svelte';
  import type { Snippet, Component } from 'svelte';

  /**
   * Modal dialog input props contract.
   * ANCHOR: MODAL_PROPS_INTERFACE
   */
  interface Props {
    /** Modal visibility flag. */
    isOpen: boolean;
    /** Modal title string header. */
    title: string;
    /** Optional subtitle description string. */
    subtitle?: string;
    /** Optional Lucide icon component reference. */
    icon?: Component;
    /** Maximum layout width class selector variant. */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
    /** Modal close callback handler. */
    onClose: () => void;
    /** Svelte 5 children content snippet. */
    children: Snippet;
  }

  let { isOpen, title, subtitle, icon: Icon, maxWidth = 'md', onClose, children }: Props = $props();

  /** Tailwind max-width class mapping lookup dictionary. ANCHOR: MAX_WIDTH_MAP */
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  /**
   * Dismisses modal when clicking directly on the backdrop container.
   *
   * ANCHOR: BACKDROP_CLICK_HANDLER
   *
   * @remarks
   * **Why `currentTarget` equality check is needed:**
   * Ensures pointer clicks originating inside child modal cards do not inadvertently close the dialog.
   */
  function handleBackdropPointerDown(e: PointerEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  /**
   * Global window keydown event handler for `Escape` dismissal.
   * ANCHOR: ESCAPE_KEY_HANDLER
   */
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
  <!-- ANCHOR: MODAL_BACKDROP -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-mono select-none"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onpointerdown={handleBackdropPointerDown}
  >
    <!-- ANCHOR: MODAL_CARD -->
    <div
      class="relative w-full {maxWidthClasses[
        maxWidth
      ]} bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- ANCHOR: MODAL_HEADER -->
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

      <!-- ANCHOR: MODAL_BODY -->
      <div class="p-5 overflow-y-auto flex-1">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
