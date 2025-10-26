<script lang="ts">
  import { toastActions } from '../stores/toasts';
  let questions = '';
  let hypotheses = '';

  function save() {
    localStorage.setItem('workflow.hypotheses', JSON.stringify({ questions, hypotheses }));
    toastActions.addToast('Preguntas e hipótesis guardadas', 'success');
  }
</script>

<section class="step">
  <h2>Preguntas e hipótesis</h2>
  <textarea placeholder="Preguntas de investigación" bind:value={questions}></textarea>
  <textarea placeholder="Hipótesis" bind:value={hypotheses}></textarea>
  <div class="actions"><button on:click={save}>Guardar</button></div>
</section>

<style>
  .step { background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 12px; }
  textarea { width: 100%; margin-top: 0.5rem; padding: 0.6rem; border-radius: 8px; border: 1px solid #e6e6e6; min-height: 100px }
  .actions { margin-top: 0.6rem }
  button { background: #3cb371; color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px }
</style>
