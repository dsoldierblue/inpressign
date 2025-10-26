<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import Header from '$lib/components/Header.svelte';
  // @ts-ignore: TypeScript sometimes resolves Svelte components to generated .d.svelte.ts files; ignore this resolution error
  import TabWorkflow from '$lib/components/TabWorkflow.svelte';
  import Toast from '$lib/components/Toast.svelte';

  let message: string = '';
  let currentProjectName: string = '';

  function onProjectSelected(project: { id?: string; name?: string }) {
    if (project?.name) currentProjectName = project.name;
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

  <Header selectedProjectName={currentProjectName} />
  <Toast />
  <TabWorkflow on:selectProject={(e: CustomEvent<any>) => onProjectSelected(e.detail)} />

<!-- No local styles in this container to avoid Svelte scoping warnings; keep styles in components or global CSS -->