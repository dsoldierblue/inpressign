<script lang="ts">
  import exifr from 'exifr';
  import { addNews } from '../utils/db';
  import { toastActions } from '../stores/toasts';
  import { onMount } from 'svelte';
  export let currentProjectId: string = 'default';
  import workflow from '../stores/workflow';
  let files: string[] = [];
  let hasProject = false;

  // subscribe to project id if not provided
  onMount(()=>{
    const unsub = workflow.subscribe(s=>{ if (s.project) { currentProjectId = s.project.id; hasProject = true; } else { hasProject = false; } });
    return unsub;
  });

  // convert a File to base64 string
  async function fileToBase64(file: File) {
    const buffer = await file.arrayBuffer();
    // convert to binary string in chunks to avoid large argument lists
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
    }
    return btoa(binary);
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (!dt) return;
    const fl = Array.from(dt.files || []) as File[];
    for (const f of fl) {
      files.push(f.name);
      // Basic metadata extraction for images
      let metadata: Record<string, any> = {};
      try {
        if (f.type && f.type.startsWith('image/')) {
          metadata = (await exifr.parse(f as File)) || {};
        }
      } catch (err) {
        console.warn('exifr failed', err);
        metadata = {};
      }

      // Prepare base64 payload and call backend save_and_extract when available
      try {
        let extracted: string | null = null;
        if ((window as any).__TAURI__) {
          const base64 = await fileToBase64(f as File);
          const { invoke } = await import('@tauri-apps/api/core');
          try {
            const res = await invoke('save_and_extract', { base64_data: base64, filename: f.name });
            if (typeof res === 'string') extracted = res;
          } catch (err) {
            console.warn('save_and_extract failed', err);
          }
        }

        if (extracted) metadata.extracted_text = extracted;

        if (!hasProject) {
          toastActions.addToast('Crea un proyecto antes de importar fuentes', 'error');
          continue;
        }

        await addNews({
          project_id: currentProjectId || 'default',
          title: f.name,
          author: 'Local import',
          source: 'local',
          section: 'import',
          published_at: new Date().toISOString(),
          keywords: [],
          metadata,
          seo_score: 0,
          bias_score: 0,
          hash: crypto.randomUUID()
        });

        toastActions.addToast(`Archivo importado: ${f.name}`, 'success');
      } catch (err) {
        console.error('addNews/extract failed', err);
        toastActions.addToast(`Error al importar ${f.name}`, 'error');
      }
    }
    localStorage.setItem('workflow.sources', JSON.stringify(files));
  }
</script>

  <section class="step" aria-label="Recolección de fuentes" on:drop|preventDefault={handleDrop} on:dragover|preventDefault>
  <h2>Recolección de fuentes</h2>
  <p>Arrastra aquí PDFs o imágenes. (Placeholder: sólo guarda nombres de archivos en localStorage)</p>
  <ul>
    {#each files as f}
      <li>{f}</li>
    {/each}
  </ul>
</section>

<style>
  .step { background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 12px; min-height: 200px }
  ul { margin-top: 0.5rem }
</style>
