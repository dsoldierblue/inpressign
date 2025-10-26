<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import Header from '../lib/components/Header.svelte';
  import NavTabs from '../lib/components/NavTabs.svelte';
  import TabProyectos from '../lib/components/TabProyectos.svelte';
  import TabNotas from '../lib/components/TabNotas.svelte';
  import TabCronologia from '../lib/components/TabCronologia.svelte';
  import TabAnalisis from '../lib/components/TabAnalisis.svelte';

  let currentTab: string = 'proyectos';
  let message: string = '';
  let currentProjectId: string = 'default';

  function setTab(tab: string) {
    currentTab = tab;
  }

  function onProjectSelected(id: string) {
    if (id) currentProjectId = id;
  }

  onMount(async () => {
    try {
      const isTauri = typeof window !== 'undefined' && !!window.__TAURI__;
      if (isTauri) {
        message = await invoke('greet', { name: 'InPressign' });
      } else {
        message = 'InPressign (modo navegador)';
      }
    } catch (e) {
      console.error('Error al invocar backend:', e);
      message = 'Error al invocar backend';
    }
  });
</script>

<Header />
<NavTabs {currentTab} on:selectTab={(e: CustomEvent<string>) => setTab(e.detail)} />

{#if currentTab === 'proyectos'}
  <TabProyectos on:selectProject={(e: CustomEvent<string>) => onProjectSelected(e.detail)} />
{:else if currentTab === 'notas'}
  <TabNotas {currentProjectId} />
{:else if currentTab === 'cronologia'}
  <TabCronologia />
{:else if currentTab === 'analisis'}
  <TabAnalisis />
{/if}

<!-- No local styles in this container to avoid Svelte scoping warnings; keep styles in components or global CSS -->