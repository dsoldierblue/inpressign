<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { createProject, listProjects } from '../utils/db';

  interface Project {
    id?: string;
    name: string;
    hash: string;
    created_at: string;
    [key: string]: any;
  }

  const dispatch = createEventDispatcher();

  let nombre: string = '';
  let hash: string = '';
  let proyectos: Project[] = [];

  async function cargarProyectos() {
    proyectos = (await listProjects()) as Project[];
  }

  async function agregarProyecto() {
    if (!nombre.trim()) return;
    const fecha = new Date().toISOString();
    const projectHash = crypto.randomUUID().slice(0, 8);
    await createProject(nombre, projectHash, fecha);
    nombre = '';
    await cargarProyectos();
  }

  function seleccionarProyecto(p: Project) {
    if (!p?.id) return;
    dispatch('selectProject', p.id);
  }

  onMount(cargarProyectos);
</script>

<section class="tab-proyectos">
  <form class="form-proyecto" on:submit|preventDefault={agregarProyecto}>
    <input placeholder="Nombre del proyecto" bind:value={nombre} />
    <button type="submit">Crear</button>
  </form>

  <div class="lista">
    {#if proyectos.length === 0}
      <p>No hay proyectos todavía.</p>
    {:else}
      {#each proyectos as p}
        <button type="button" class="card" on:click={() => seleccionarProyecto(p)} aria-label={"Seleccionar proyecto " + p.name}>
          <h3>{p.name}</h3>
          <small>Hash: {p.hash}</small>
          <small>{new Date(p.created_at).toLocaleString()}</small>
        </button>
      {/each}
    {/if}
  </div>
</section>

<style>
  .tab-proyectos { display: flex; flex-direction: column; gap: 1rem; }
  .form-proyecto {
    display: flex;
    gap: 0.8rem;
    background: rgba(255,255,255,0.6);
    padding: 1rem;
    border-radius: 14px;
    backdrop-filter: blur(10px);
  }
  input {
    flex: 1;
    border: none;
    border-radius: 10px;
    padding: 0.6rem 1rem;
    font-size: 1rem;
  }
  button {
    background: #3cb371;
    border: none;
    color: white;
    font-weight: 600;
    border-radius: 10px;
    padding: 0 1.2rem;
    transition: all 0.25s ease;
  }
  button:hover { background: #2e8b57; }
  .lista {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit,minmax(200px,1fr));
  }
  .card {
    display: block;
    background: rgba(255,255,255,0.7);
    border-radius: 14px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border: none;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }
  .card h3 { margin: 0 0 0.4rem 0; color: #2e2e2e; }
</style>