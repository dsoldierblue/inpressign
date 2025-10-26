<script lang="ts">
  import exifr from 'exifr';
  import { addNews } from '../utils/db';
  let isDragging = false;
  let msg = 'Suelta aquí tus noticias o imágenes';
  export let currentProjectId: string = 'default';

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const dt = e.dataTransfer;
    if (!dt) return;
    const files: FileList = dt.files;
    for (const f of Array.from(files)) {
      let metadata: Record<string, any> = {};
      if (f.type && f.type.startsWith('image/')) {
        try {
          metadata = await exifr.parse(f as File) as Record<string, any>;
        } catch (err) {
          console.warn('exifr parse failed', err);
          metadata = {};
        }
      }
      const doc = {
        id: crypto.randomUUID(),
        filename: f.name,
        created_at: new Date().toISOString(),
        metadata: JSON.stringify(metadata)
      };
      await addNews({
        project_id: currentProjectId || 'default',
        title: f.name,
        author: 'Desconocido',
        source: 'Local',
        section: 'Sin sección',
        published_at: new Date().toISOString(),
        keywords: [],
        metadata,
        seo_score: 0,
        bias_score: 0,
        hash: crypto.randomUUID()
      });
    }
    msg = 'Archivos guardados correctamente';
  }
</script>

<div
  class="dropzone"
  role="region"
  aria-label="Zona de carga de archivos"
  on:dragover|preventDefault={() => (isDragging = true)}
  on:dragleave={() => (isDragging = false)}
  on:drop={handleDrop}
>
  <p class:is-dragging={isDragging}>{msg}</p>
</div>

<style>
  .dropzone {
    border: 2px dashed #3cb371;
    border-radius: 14px;
    padding: 3rem;
    text-align: center;
    background: rgba(255,255,255,0.5);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }
  .is-dragging { color: #2e8b57; font-weight: 700; }
  .dropzone:hover { background: rgba(60,179,113,0.15); }
</style>