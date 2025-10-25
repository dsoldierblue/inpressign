<script>
  import { onMount } from "svelte";

  let currentTab = "proyectos";
  let message = "";

  async function greet() {
    try {
      const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
      if (isTauri) {
        const { invoke } = await import("@tauri-apps/api");
        message = await invoke("greet", { name: "InPressign" });
      } else {
        message = "InPressign (modo navegador)";
      }
    } catch (e) {
      console.error("Error al invocar comando Tauri:", e);
      message = "Error al invocar backend";
    }
  }

  onMount(greet);
</script>

<style>
  body, html {
    margin: 0;
    padding: 0;
    font-family: Inter, sans-serif;
    background: #ffffff;
    color: #2e2e2e;
  }
  header {
    background: #3cb371;
    color: white;
    padding: 1rem 2rem;
    font-size: 1.5rem;
    font-weight: bold;
  }
  nav {
    display: flex;
    gap: 1rem;
    background: #f3f3f3;
    padding: 0.5rem 1rem;
  }
  nav button {
    border: none;
    background: transparent;
    cursor: pointer;
    font-weight: bold;
    color: #2e2e2e;
    transition: color 0.3s;
  }
  nav button.active {
    color: #3cb371;
  }
  main {
    padding: 2rem;
  }
</style>

<header>InPressign – Gestor Periodístico</header>

<nav>
  <button on:click={() => currentTab = 'proyectos'} class:active={currentTab==='proyectos'}>Proyectos</button>
  <button on:click={() => currentTab = 'notas'} class:active={currentTab==='notas'}>Notas de prensa</button>
  <button on:click={() => currentTab = 'cronologia'} class:active={currentTab==='cronologia'}>Cronología</button>
  <button on:click={() => currentTab = 'analisis'} class:active={currentTab==='analisis'}>Análisis</button>
</nav>

<main>
  {#if currentTab === 'proyectos'}
    <p>{message}</p>
    <p>Aquí podrás crear y gestionar proyectos periodísticos.</p>
  {:else if currentTab === 'notas'}
    <p>Aquí podrás arrastrar y soltar archivos PDF o imágenes.</p>
  {:else if currentTab === 'cronologia'}
    <p>Visualiza la evolución temporal de tus noticias.</p>
  {:else if currentTab === 'analisis'}
    <p>Analiza sesgo y SEO de tus textos.</p>
  {/if}
</main>