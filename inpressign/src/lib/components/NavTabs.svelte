
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ selectTab: string }>();
  // Prop name aligned with parent usage
  export let currentTab: string = 'Proyectos';
  const tabs: string[] = ['Proyectos', 'Notas', 'Cronología', 'Análisis'];

  function select(tab: string) {
    dispatch('selectTab', tab);
  }
</script>

<div class="nav-tabs" role="tablist" aria-label="Main tabs">
  {#each tabs as tab}
    <button
      class:active={tab === currentTab}
      on:click={() => select(tab)}
      role="tab"
      aria-selected={tab === currentTab}
      tabindex={tab === currentTab ? 0 : -1}
      type="button"
    >
      {tab}
    </button>
  {/each}
</div>

<style>
  .nav-tabs {
    display: flex;
    justify-content: center;
    gap: 0.8rem;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(12px);
    border-radius: 14px;
    padding: 0.6rem 0.8rem;
    box-shadow: 0 4px 14px rgba(0,0,0,0.08);
  }
  button {
    border: none;
    background: transparent;
    font-weight: 600;
    color: #2e2e2e;
    border-radius: 10px;
    padding: 0.5rem 1.2rem;
    transition: all 0.25s ease;
  }
  button:hover:not(.active) {
    background: rgba(60,179,113,0.15);
  }
  button.active {
    background: rgba(60,179,113,0.9);
    color: white;
    box-shadow: 0 0 8px rgba(60,179,113,0.5);
  }
</style>