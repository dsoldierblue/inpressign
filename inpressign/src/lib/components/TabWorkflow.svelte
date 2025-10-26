<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import workflow from '../stores/workflow';
  import StepProject from './StepProject.svelte';
  import StepIdea from './StepIdea.svelte';
  import StepContent from './StepContent.svelte';
  import StepPeople from './StepPeople.svelte';
  import StepQuestions from './StepQuestions.svelte';
  import StepMap from './StepMap.svelte';
  import StepSources from './StepSources.svelte';
  import StepAnalysis from './StepAnalysis.svelte';
  import StepDraft from './StepDraft.svelte';
  import StepDraftGenerated from './StepDraftGenerated.svelte';
  import StepReview from './StepReview.svelte';

  const dispatch = createEventDispatcher();

  const steps = [
    { id: 'project', label: 'Proyecto' },
    { id: 'idea', label: 'Idea' },
    { id: 'content', label: 'Textos' },
    { id: 'people', label: 'Personas' },
    { id: 'questions', label: 'Preguntas' },
    { id: 'map', label: 'Mapa' },
    { id: 'sources', label: 'Fuentes' },
    { id: 'analysis', label: 'Análisis' },
    { id: 'draft', label: 'Borrador' },
    { id: 'review', label: 'Revisión' }
  ];

  let current = 0;
  let currentProject: any = null;
  let hasProject = false;

  onMount(()=>{
    const unsub = workflow.subscribe(s=>{
      hasProject = !!s.project;
      if (s.project && (!currentProject || s.project.id !== currentProject.id)) {
        currentProject = s.project; dispatch('selectProject', s.project);
      }
    });
    return unsub;
  });

  function go(i:number){ current = i; }
</script>

<div class="workflow">
  <nav class="steps">
    {#each steps as st, i}
      <button class:active={i===current} on:click={()=>{ if (!hasProject && i !== 0) return; go(i); }} aria-disabled={!hasProject && i !== 0} title={!hasProject && i !== 0 ? 'Crea un proyecto primero' : ''}>{st.label}</button>
    {/each}
  </nav>
  <main class="panel">
    {#if current===0}
      <StepProject />
    {:else if current===1}
      <StepIdea />
    {:else if current===2}
      <StepContent />
    {:else if current===3}
      <StepPeople />
    {:else if current===4}
      <StepQuestions />
    {:else if current===5}
      <StepMap />
    {:else if current===6}
      <StepSources />
    {:else if current===7}
      <StepAnalysis />
    {:else if current===8}
      <StepDraftGenerated />
    {:else if current===9}
      <StepReview />
    {/if}
  </main>
</div>

<style>
  .workflow{ display:flex; gap:1rem }
  .steps{ display:flex; flex-direction:column; gap:0.4rem; min-width:140px }
  .steps button{ padding:0.6rem; border-radius:8px; border:1px solid #ddd; background:#fafafa }
  .steps button.active{ background:#3cb371; color:white }
  .panel{ flex:1 }
</style>
