<script lang="ts">
  import workflow from '../stores/workflow';
  import { onMount } from 'svelte';
  import { toastActions } from '../stores/toasts';
  // Enhanced people editor: flexible metadata up to many custom fields
  let people:any[] = [];
  let hasProject = false;
  // form state
  let editingId: string | null = null;
  let form: Record<string, any> = {
    firstName: '',
    lastName: '',
    age: '',
    birthDate: '',
    deathDate: '',
    profession: '',
    role: '',
    affiliation: '',
    email: '',
    phone: '',
    nationality: '',
    gender: '',
    notes: '',
    aliases: '',
    tags: ''
  };
  let customFields: Array<{ key: string; value: string }> = [];

  function resetForm(){ editingId = null; form = { firstName:'', lastName:'', age:'', birthDate:'', deathDate:'', profession:'', role:'', affiliation:'', email:'', phone:'', nationality:'', gender:'', notes:'', aliases:'', tags:'' }; customFields = []; }

  function addOrUpdate(){
    if(!hasProject){ toastActions.addToast('Crea un proyecto primero', 'error'); return; }
    // build metadata from customFields and any non-empty extras
    const metadata: Record<string, any> = {};
    for(const f of customFields){ if(f.key.trim()) metadata[f.key] = f.value; }
    // parse tags and aliases as arrays
    const tags = form.tags ? String(form.tags).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    const aliases = form.aliases ? String(form.aliases).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    const personObj: any = {
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      age: form.age? Number(form.age) : undefined,
      notes: form.notes || undefined,
      roles: form.role ? [form.role] : undefined,
      tags: tags.length?tags:undefined,
      metadata: { ...metadata, profession: form.profession || undefined, affiliation: form.affiliation || undefined, email: form.email || undefined, phone: form.phone || undefined, nationality: form.nationality || undefined, gender: form.gender || undefined }
    };

    if (editingId) {
      workflow.updatePerson(editingId, personObj);
      toastActions.addToast('Persona actualizada', 'success');
    } else {
      workflow.addPerson(personObj);
      toastActions.addToast('Persona añadida', 'success');
    }
    resetForm();
  }

  function remove(id:string){ workflow.removePerson(id); }

  function edit(id:string){ const p = people.find(x=>x.id===id); if(!p) return; editingId = id; form.firstName = p.firstName || ''; form.lastName = p.lastName || ''; form.age = p.age || ''; form.birthDate = p.birthDate || ''; form.deathDate = p.deathDate || ''; form.profession = p.metadata?.profession || ''; form.role = (p.roles && p.roles[0]) || ''; form.affiliation = p.metadata?.affiliation || ''; form.email = p.metadata?.email || ''; form.phone = p.metadata?.phone || ''; form.nationality = p.metadata?.nationality || ''; form.gender = p.metadata?.gender || ''; form.notes = p.notes || ''; form.aliases = (p.metadata?.aliases || []).join(', '); form.tags = (p.tags || []).join(', '); customFields = Object.entries(p.metadata || {}).filter(([k])=>!['profession','affiliation','email','phone','nationality','gender','aliases','name','label'].includes(k)).map(([k,v])=>({key:k,value:String(v)})); }

  import type { WorkflowState } from '../stores/workflow';
  onMount(()=>{
    const unsub = workflow.subscribe((s: WorkflowState)=>{ people=s.people; hasProject = !!s.project; });
    return unsub;
  });
</script>

<section class="step">
  <h2>Paso 2 — Personas</h2>
  <label>Nombre<br><input bind:value={form.firstName} /></label>
  <label>Apellido<br><input bind:value={form.lastName} /></label>
  <label>Edad<br><input type="number" bind:value={form.age} /></label>
  <label>Fecha de nacimiento<br><input type="date" bind:value={form.birthDate} /></label>
  <label>Fecha de defunción (si aplica)<br><input type="date" bind:value={form.deathDate} /></label>
  <div class="actions"><button on:click={addOrUpdate}>{editingId? 'Guardar cambios':'Añadir persona'}</button> <button on:click={resetForm} type="button">Limpiar</button></div>

  <h3>Campos adicionales</h3>
  <div class="custom-fields">
    {#each customFields as cf, i}
      <div class="cf">
        <input placeholder="Clave" bind:value={cf.key} on:input={() => customFields = [...customFields]} />
        <input placeholder="Valor" bind:value={cf.value} on:input={() => customFields = [...customFields]} />
        <button on:click={() => { customFields = customFields.filter((_x, idx) => idx !== i); }}>Eliminar</button>
      </div>
    {/each}
    {#if customFields.length < 30}
      <div class="cf-add">
        <button on:click={() => { customFields = [...customFields, {key:'', value:''}]; }} type="button">Añadir campo personalizado</button>
      </div>
    {/if}
  </div>

  <h3>Personas añadidas</h3>
  <ul>
    {#each people as p}
      <li>
        <strong>{p.firstName || p.metadata?.name || p.metadata?.label || (p.tags && p.tags[0]) || 'Persona'}</strong>
        <div class="meta">{#if p.firstName || p.lastName}{p.firstName} {p.lastName}{/if} {#if p.age} — {p.age}{/if} {#if p.roles} — {p.roles.join(', ')}{/if}</div>
        <div class="actions-inline"><button on:click={()=>edit(p.id)}>Editar</button> <button on:click={()=>remove(p.id)}>Eliminar</button></div>
      </li>
    {/each}
  </ul>
</section>

<style>
  .step{ background: rgba(255,255,255,0.9); padding:1rem; border-radius:12px }
  input{ width:100%; padding:0.4rem; margin-bottom:0.4rem }
</style>
