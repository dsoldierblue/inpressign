<script lang="ts">
  import workflow from '../stores/workflow';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { toastActions } from '../stores/toasts';
  let hasProject = false;
  let type: 'text'|'quote'|'data' = 'text';
  let text = '';
  let tagInput = '';
  let tags: string[] = [];
  let contents = [] as any[];

  function addTag() { if (tagInput.trim()) { tags.push(tagInput.trim()); tagInput=''; } }
  function addBlock(){ if (!hasProject) { toastActions.addToast('Crea un proyecto primero', 'error'); return; } workflow.addContent(type, text, tags); text=''; tags=[]; }
  function remove(id:string){ workflow.removeContent(id); }

  onMount(()=>{ const unsub = workflow.subscribe(s=>{ contents = s.contents; hasProject = !!s.project; }); return unsub; });
</script>

<section class="step">
  <h2>Paso 1 — Textos, citas y datos</h2>
  <div class="form">
    <label>Tipo
      <select bind:value={type}><option value="text">Texto crudo</option><option value="quote">Cita</option><option value="data">Datos</option></select>
    </label>
    <label>Contenido
      <textarea bind:value={text} placeholder="Escribe texto, cita o dato"></textarea>
    </label>
    <label>Etiquetas / temas
      <div class="tags">
        <input bind:value={tagInput} placeholder="Etiqueta" />
        <button type="button" on:click={addTag}>+</button>
      </div>
      <div class="taglist">{#each tags as t}<span class="tag">{t}</span>{/each}</div>
    </label>
    <div class="actions"><button on:click={addBlock}>Añadir</button></div>
  </div>

  <h3>Bloques añadidos</h3>
  <ul>
    {#each contents as c}
      <li><strong>{c.type}</strong> — {c.text.slice(0,120)}... <button on:click={()=>remove(c.id)}>Eliminar</button></li>
    {/each}
  </ul>
</section>

<style>
  .step{ background: rgba(255,255,255,0.9); padding:1rem; border-radius:12px }
  textarea{ width:100%; min-height:120px }
  .tags{ display:flex; gap:0.4rem }
  .tag{ background:#eee; padding:0.2rem 0.4rem; border-radius:6px; margin-right:0.3rem }
  button{ background:#3cb371;color:white;border:none;padding:0.4rem 0.6rem;border-radius:6px }
</style>
