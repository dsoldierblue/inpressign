<script lang="ts">
  // Local fallback to avoid depending on ../stores/toasts which may be missing.
  // This dispatches a 'toast' CustomEvent that a global toast system can listen to,
  // and logs to console as a server-safe/no-op alternative.
  const toastActions = {
    addToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }));
      } else {
        // server or test environment: no-op but log for diagnostics
        // eslint-disable-next-line no-console
        console.log('[toast]', type, message);
      }
    }
  };

  let notes = '';
  function save() {
    localStorage.setItem('workflow.background', notes);
    toastActions.addToast('Antecedentes guardados', 'success');
  }
</script>

<section class="step">
  <h2>Revisión de antecedentes</h2>
  <textarea placeholder="Notas y referencias" bind:value={notes}></textarea>
  <div class="actions"><button on:click={save}>Guardar</button></div>
</section>

<style>
  .step { background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 12px; }
  textarea { width: 100%; margin-top: 0.5rem; padding: 0.6rem; border-radius: 8px; border: 1px solid #e6e6e6; min-height: 160px }
  .actions { margin-top: 0.6rem }
  button { background: #3cb371; color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px }
</style>
