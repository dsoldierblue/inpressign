<script lang="ts">
  import workflow from '../stores/workflow';
  import { onMount } from 'svelte';
  let draft=''; let contents:any[]=[]; let people:any[]=[]; let questions:any[]=[]; let bias=0; let seo=0;
  function generate(){ // concatenate pieces
    const s = [ ...contents.map(c=>`[${c.type}] ${c.text}`), '\nPersonas:\n', ...people.map(p=>`${p.firstName} ${p.lastName} (${p.age||'-'})`), '\nPreguntas:\n', ...questions.map(q=>q.text) ].join('\n\n');
    draft = s; computeMetrics(); workflow.setDraft(draft);
  }
  function computeMetrics(){ const t = draft.toLowerCase(); let score=50; if(t.includes('confirmado')) score+=10; if(t.includes('no confirmado')) score-=10; bias = Math.max(0,Math.min(100,score)); seo = Math.max(0,Math.min(100, Math.floor(Math.min(100, (t.split(/\s+/).length/200)*70)))); }
  function save(){ workflow.setDraft(draft); toastActions.addToast('Borrador guardado', 'success'); }
  onMount(()=> workflow.subscribe(s=>{ contents=s.contents; people=s.people; questions=s.questions; draft=s.draft||''; }));
  import { toastActions } from '../stores/toasts';
</script>

<section class="step">
  <h2>Paso 5 — Generar borrador base</h2>
  <div class="actions"><button on:click={generate}>Generar texto base</button></div>
  <textarea bind:value={draft}></textarea>
  <div class="metrics">Sesgo: {bias}% — SEO: {seo}%</div>
  <div class="actions"><button on:click={save}>Guardar borrador</button></div>
</section>

<style>
  .step{ background: rgba(255,255,255,0.9); padding:1rem; border-radius:12px }
  textarea{ width:100%; min-height:200px; margin-top:0.6rem }
</style>
