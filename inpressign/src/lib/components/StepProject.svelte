<script lang="ts">
  import { workflow } from '../stores/workflow';
  import { initDB, createProject as dbCreateProject } from '../utils/db';
  import { onMount } from 'svelte';
  import { toastActions } from '../stores/toasts';
  let name = '';
  let authorsText = '';
  async function create() {
    const authors = authorsText.split(',').map(s=>s.trim()).filter(Boolean);
    if (!name) { toastActions.addToast('Introduce el nombre del proyecto', 'error'); return; }
    // Try to initialize DB and persist. If DB cannot be initialized, inform the user
    // and stop — we don't silently fall back to local persistence when the DB is desired.
    try {
      await initDB();
    } catch (err) {
      console.error('initDB failed', err);
      toastActions.addToast('No se pudo inicializar la base de datos. Asegúrate de ejecutar la app en modo escritorio (Tauri).', 'error');
      return;
    }

    try {
      const hash = crypto.randomUUID();
      await dbCreateProject(name, authors.join(', '), hash);
      workflow.setProject(name, authors);
      toastActions.addToast('Proyecto creado y guardado en la base de datos', 'success');
    } catch (err) {
      console.error('DB createProject failed', err);
      toastActions.addToast('Error al guardar el proyecto en la base de datos', 'error');
    }
  }

  onMount(()=>{
    // prefill if existing
    let unsub = workflow.subscribe(s=>{ if (s.project) { name=s.project.name; authorsText = s.project.authors.join(', '); } });
    setTimeout(()=>unsub,0);
  });
</script>

<section class="step">
  <h2>Paso 0 — Crear proyecto</h2>
  <label>Nombre del proyecto<br><input bind:value={name} placeholder="Ej: Investigación X" /></label>
  <label>Creadores / autores (separados por coma)<br><input bind:value={authorsText} placeholder="Nombre1, Nombre2" /></label>
  <div class="actions"><button on:click={create}>Crear proyecto</button></div>
</section>

<style>
  .step { background: rgba(255,255,255,0.9); padding: 1rem; border-radius: 12px }
  label { display:block; margin-top:0.6rem }
  input { width:100%; padding:0.4rem }
  button { margin-top:0.8rem; background:#3cb371;color:white;border:none;padding:0.6rem 1rem;border-radius:8px }
</style>
