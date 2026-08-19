<script lang="ts">
  import { onMount } from 'svelte';
  import './app.css';
  import Workspace from './lib/workspace/Workspace.svelte';
  import DocsView from './lib/docs/DocsView.svelte';
  import SettingsModal from './lib/shared/SettingsModal.svelte';
  import { i18n } from './lib/i18n/i18n.svelte';
  import { themeStore } from './lib/theme/theme.svelte';

  let currentRoute = $state<'workspace' | 'docs'>('workspace');

  function updateRoute() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/docs' || hash.startsWith('#docs')) {
      currentRoute = 'docs';
    } else {
      currentRoute = 'workspace';
    }
  }

  onMount(() => {
    document.documentElement.lang = i18n.lang;
    themeStore.sync();
    updateRoute();

    window.addEventListener('popstate', updateRoute);
    window.addEventListener('hashchange', updateRoute);

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (themeStore.theme === 'system') {
        themeStore.sync();
      }
    };
    mql.addEventListener('change', handler);

    return () => {
      window.removeEventListener('popstate', updateRoute);
      window.removeEventListener('hashchange', updateRoute);
      mql.removeEventListener('change', handler);
    };
  });

  function navigateToWorkspace() {
    window.history.pushState({}, '', '/');
    currentRoute = 'workspace';
  }
</script>

{#if currentRoute === 'docs'}
  <DocsView onBack={navigateToWorkspace} />
{:else}
  <Workspace />
{/if}

<SettingsModal />