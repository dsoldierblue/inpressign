<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const tabs: string[] = ['Proyectos', 'Notas', 'Cronología', 'Análisis'];
  let activeTab: string = tabs[0];

  const dispatch = createEventDispatcher<{ selectTab: string }>();

  function selectTab(tab: string) {
    activeTab = tab;
    dispatch('selectTab', tab);
  }
</script>

<div class="nav-tabs" role="tablist" aria-label="Main tabs">
  {#each tabs as tab}
    <button
      class:active={tab === activeTab}
      on:click={() => selectTab(tab)}
      role="tab"
      aria-selected={tab === activeTab}
      type="button"
      tabindex={tab === activeTab ? 0 : -1}
    >
      <span>{tab}</span>
    </button>
  {/each}
</div>

<style>
  .nav-tabs {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(14px);
    border-radius: var(--radius);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    padding: 0.6rem 0.8rem;
    user-select: none;
    transition: var(--transition);
  }

  button {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0.7rem 1.2rem;
    font-weight: 600;
    color: #2e2e2e;
    border-radius: 12px;
    font-size: 1rem;
    letter-spacing: 0.02em;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }

  button::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(60,179,113,0.15), rgba(60,179,113,0.3));
    opacity: 0;
    transition: opacity 0.25s ease;
    z-index: 0;
  }

  button:hover::after {
    opacity: 1;
  }

  button span {
    position: relative;
    z-index: 1;
  }

  button.active {
    background: rgba(60,179,113,0.9);
    color: white;
    box-shadow: 0 2px 10px rgba(60,179,113,0.3);
    transform: translateY(-1px);
  }

  button:focus-visible {
    outline: 2px solid rgba(60,179,113,0.8);
    outline-offset: 2px;
  }

  @media (max-width: 600px) {
    .nav-tabs {
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    button {
      flex: 1 1 calc(50% - 0.4rem);
      font-size: 0.95rem;
      padding: 0.6rem 1rem;
    }
  }
</style>