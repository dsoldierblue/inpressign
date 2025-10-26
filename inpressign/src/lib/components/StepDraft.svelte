<script lang="ts">
  import { onMount } from 'svelte';
  import { toastActions } from '../stores/toasts';
  import workflow from '../stores/workflow';
  let draft = '';
  let hasProject = false;

  onMount(() => {
    const unsub = workflow.subscribe(s=>{ draft = s.draft || ''; hasProject = !!s.project; });
    return unsub;
  });

  function save() {
    if (!hasProject) { toastActions.addToast('Crea un proyecto antes de guardar borrador', 'error'); return; }
    workflow.setDraft(draft);
    toastActions.addToast('Borrador guardado', 'success');
  }
</script>

<section class="step">
  <h2>Redacción</h2>
  <textarea bind:value={draft} placeholder="Escribe tu artículo aquí..."></textarea>
  <div class="actions"><button on:click={save}>Guardar borrador</button></div>
</section>

<style>
  .step { background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 12px; }
  textarea { width: 100%; min-height: 240px; margin-top: 0.5rem }
  button { background: #3cb371; color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px }
</style>
