<script lang="ts">
  import workflow from '../stores/workflow';
  import { onMount } from 'svelte';
  import { toastActions } from '../stores/toasts';
  let text=''; let questions:any[] = []; let people:any[] = []; let contents:any[] = []; let tags:string[] = [];
  let hasProject = false;
  function add(){ if(!hasProject){ toastActions.addToast('Crea un proyecto primero', 'error'); return; } if(!text) return; const q = workflow.addQuestion(text); text=''; }
  onMount(()=> workflow.subscribe(s=>{ questions=s.questions; people=s.people; contents=s.contents; tags = Array.from(new Set(s.contents.flatMap((c:any)=>c.tags || []))); hasProject = !!s.project }));
  function link(qid:string, opt:string, id:string){ const patch:any = {} ; if(opt==='person') { patch.linkedPeople=[...(questions.find(q=>q.id===qid)?.linkedPeople||[]), id]; workflow.addLink(qid, id); } if(opt==='block') { patch.linkedBlocks=[...(questions.find(q=>q.id===qid)?.linkedBlocks||[]), id]; workflow.addLink(qid, id); } if(opt==='tag') { patch.linkedTags=[...(questions.find(q=>q.id===qid)?.linkedTags||[]), id]; }
    workflow.linkQuestion(qid, patch);
  }
</script>

<section class="step">
  <h2>Paso 3 — Preguntas e hipótesis</h2>
  <label>Pregunta / Hipótesis<br><input bind:value={text} /></label>
  <div class="actions"><button on:click={add}>Añadir pregunta</button></div>

  <h3>Preguntas</h3>
  <ul>
    {#each questions as q}
      <li>
        {q.text}
        <div class="links">
          <label>Vincular persona
            <select on:change={(e:Event)=>link(q.id,'person', (e.target as HTMLSelectElement).value)}>
              <option value="">—</option>
              {#each people as p}<option value={p.id}>{p.firstName} {p.lastName}</option>{/each}
            </select>
          </label>
          <label>Vincular bloque
            <select on:change={(e:Event)=>link(q.id,'block', (e.target as HTMLSelectElement).value)}>
              <option value="">—</option>
              {#each contents as c}<option value={c.id}>{c.type} {c.text.slice(0,30)}</option>{/each}
            </select>
          </label>
          <label>Vincular tag
            <select on:change={(e:Event)=>link(q.id,'tag', (e.target as HTMLSelectElement).value)}>
              <option value="">—</option>
              {#each tags as t}<option value={t}>{t}</option>{/each}
            </select>
          </label>
        </div>
      </li>
    {/each}
  </ul>
</section>

<style>
  .step{ background: rgba(255,255,255,0.9); padding:1rem; border-radius:12px }
  input, select{ width:100%; padding:0.4rem; margin-bottom:0.4rem }
  .links{ display:flex; gap:0.6rem; margin-top:0.4rem }
</style>
