<script lang="ts">
  import workflow from '../stores/workflow';
  import { onMount } from 'svelte';
  import { toastActions } from '../stores/toasts';
  let draft=''; let authors:string[]=[]; let hasProject = false;
  onMount(()=> workflow.subscribe(s=>{ draft=s.draft||''; authors = s.project?.authors||[]; hasProject = !!s.project }));
  function sign(){ if (!hasProject) { toastActions.addToast('Crea un proyecto antes de marcar revisión', 'error'); return; } toastActions.addToast('Artículo marcado como revisado y firmado', 'success'); }
</script>

<section class="step">
  <h2>Paso 6 — Revisión y firma</h2>
  <p>Autores: {#each authors as a, i}{a}{#if i < authors.length - 1}, {/if}{/each}</p>
  <h3>Revisar borrador</h3>
  <textarea readonly bind:value={draft}></textarea>
  <div class="actions"><button on:click={sign}>Marcar como revisado y firmar</button></div>
</section>

<style>
  .step{ background: rgba(255,255,255,0.9); padding:1rem; border-radius:12px }
  textarea{ width:100%; min-height:180px }
</style>
