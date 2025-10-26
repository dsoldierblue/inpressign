<script lang="ts">
  import { onMount } from 'svelte';
  import { toastActions } from '../stores/toasts';
  import workflow from '../stores/workflow';
  let idea = '';
  let notes = '';
  let hasProject = false;

  function save() {
    if (!hasProject) { toastActions.addToast('Crea un proyecto antes de guardar la idea', 'error'); return; }
    // Save the idea as a content block (text-only topic). Notes are optional and not saved as the main "tema".
    workflow.addContent('text', idea || '', []);
    toastActions.addToast('Idea / tema guardado en el flujo', 'success');
  }

  onMount(() => {
    const unsub = workflow.subscribe(s=>{ hasProject = !!s.project; });
    // load previously saved idea from localStorage if present (migration helper)
    const data = localStorage.getItem('workflow.idea');
    if (data) {
      try{
        const parsed = JSON.parse(data);
        idea = parsed.idea || '';
        notes = parsed.notes || '';
      }catch(e){}
    }
    return unsub;
  });
</script>

<section class="step">
  <h2>Idea / Tema</h2>
  <input placeholder="Título de la idea" bind:value={idea} />
  <textarea placeholder="Notas rápidas" bind:value={notes}></textarea>
  <div class="actions"><button on:click={save}>Guardar</button></div>
</section>

<style>
  .step { background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 12px; }
  input, textarea { width: 100%; margin-top: 0.5rem; padding: 0.6rem; border-radius: 8px; border: 1px solid #e6e6e6 }
  textarea { min-height: 160px }
  .actions { margin-top: 0.6rem }
  button { background: #3cb371; color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px }
</style>
