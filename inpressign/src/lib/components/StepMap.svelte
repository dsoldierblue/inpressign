<script lang="ts">
  import { onMount } from 'svelte';
  import workflow from '../stores/workflow';
  import type { WorkflowState } from '../stores/workflow';
  import { toastActions } from '../stores/toasts';

  // reactive node/link lists from store
  let nodes: Array<any> = [];
  let links: Array<any> = [];
  let hasProject = false;

  // selection and dragging state
  let selectedFrom: string | null = null;
  let draggingId: string | null = null;
  let dragOffset = { x: 0, y: 0 };

  onMount(() => {
    const unsub = workflow.subscribe((s: WorkflowState) => {
      nodes = s.nodes.nodes || [];
      links = s.nodes.links || [];
      hasProject = !!s.project;
    });
    return unsub;
  });

  // add node via store helper
  let label = '';
  function addNode() {
    if (!hasProject) { toastActions.addToast('Crea un proyecto primero', 'error'); return; }
    if (!label) return;
    workflow.addNode(label, 'manual');
    toastActions.addToast('Nodo añadido', 'success');
    label = '';
  }

  // create a link between two selected node ids (UI selects)
  let fromId = '';
  let toId = '';
  function addLinkLocal() {
    if (!hasProject) { toastActions.addToast('Crea un proyecto primero', 'error'); return; }
    if (!fromId || !toId) return;
    workflow.addLink(fromId, toId);
    toastActions.addToast('Enlace creado', 'success');
    fromId = '';
    toId = '';
  }

  function nodePointerDown(e: PointerEvent, node: any) {
    e.stopPropagation();
    draggingId = node.id;
    const svg = (e.currentTarget as SVGElement).ownerSVGElement as SVGElement | null;
    const rect = svg?.getBoundingClientRect();
    const px = e.clientX - (rect?.left || 0);
    const py = e.clientY - (rect?.top || 0);
    dragOffset.x = (node.x ?? px) - px;
    dragOffset.y = (node.y ?? py) - py;
    window.addEventListener('pointermove', nodePointerMove);
    window.addEventListener('pointerup', nodePointerUp);
  }

  function nodePointerMove(e: PointerEvent) {
    if (!draggingId) return;
    const svg = document.querySelector('svg');
    const rect = svg?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0) + dragOffset.x;
    const y = e.clientY - (rect?.top || 0) + dragOffset.y;
    workflow.setNodePosition(draggingId, x, y);
  }

  function nodePointerUp() {
    draggingId = null;
    window.removeEventListener('pointermove', nodePointerMove);
    window.removeEventListener('pointerup', nodePointerUp);
  }

  // click-to-link behavior: click one node, then another to link
  function nodeClicked(node: any) {
    if (!hasProject) { toastActions.addToast('Crea un proyecto primero', 'error'); return; }
    if (selectedFrom && selectedFrom !== node.id) {
      workflow.addLink(selectedFrom, node.id);
      toastActions.addToast('Enlace creado', 'success');
      selectedFrom = null;
    } else {
      selectedFrom = node.id;
    }
  }
</script>

<section class="step">
  <h2>Paso 4 — Mapa de nodos</h2>
  <p>Vista simple de nodos y conexiones (visualización mínima).</p>
  <label>Añadir nodo<br><input bind:value={label} /><button on:click={addNode}>+</button></label>

  <div style="margin-top:0.6rem">
    <label>Crear enlace entre nodos<br>
      <select bind:value={fromId}>
        <option value="">—</option>
        {#each nodes as n}<option value={n.id}>{n.label}</option>{/each}
      </select>
      <select bind:value={toId}>
        <option value="">—</option>
        {#each nodes as n}<option value={n.id}>{n.label}</option>{/each}
      </select>
      <button on:click={addLinkLocal}>Vincular</button>
    </label>
  </div>

  <div class="map">
    <svg width="100%" height="480" style="touch-action: none">
      {#each links as l}
        {#if nodes.findIndex(x=>x.id===l.from) >=0 && nodes.findIndex(x=>x.id===l.to) >=0}
          {@const a = nodes.find(x=>x.id===l.from)}
          {@const b = nodes.find(x=>x.id===l.to)}
          {#if a && b}
            {@const sx = a.x ?? 40}
            {@const sy = a.y ?? 40}
            {@const tx = b.x ?? 120}
            {@const ty = b.y ?? 40}
            {@const mx = (sx + tx) / 2}
            {@const my = (sy + ty) / 2 - 40}
            <path d={`M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`} stroke="#8b8b8b" fill="none" stroke-width="2" />
          {/if}
        {/if}
      {/each}

      {#each nodes as n}
        {@const cx = n.x ?? 40}
        {@const cy = n.y ?? 40}
        <g role="button" tabindex="0" aria-label={`Nodo ${n.label}`} on:click={() => nodeClicked(n)} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { nodeClicked(n); e.preventDefault(); } }} on:pointerdown={(e) => nodePointerDown(e as PointerEvent, n)} style="cursor:grab">
          <circle cx={cx} cy={cy} r="22" fill={selectedFrom === n.id ? '#ffb74d' : '#61dafb'} stroke="#222" stroke-width={selectedFrom === n.id ? 3 : 1} />
          <text x={cx} y={cy} font-size="10" text-anchor="middle" dy="4">{n.label}</text>
        </g>
      {/each}
    </svg>
  </div>
</section>

<style>
  .map{ background:#fff; padding:0.6rem; border-radius:8px }
  input{ padding:0.4rem }
</style>
