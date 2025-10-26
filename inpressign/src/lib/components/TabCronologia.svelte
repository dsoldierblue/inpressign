<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  let canvas: HTMLCanvasElement | null = null;

  onMount(async () => {
    // Dynamically import the DB module and use the available export `listProjects`.
    const dbModule = await import('../utils/db');
  const listProjects = dbModule.listProjects || (dbModule as any).default?.listProjects;

    type Project = { created_at: string; [key: string]: any };

    const docs: Project[] = listProjects ? await listProjects() : [];
    const fechas = docs.map((d: Project) => {
      try {
        return new Date(d.created_at).toLocaleDateString();
      } catch {
        return 'Unknown';
      }
    });
    const conteo: Record<string, number> = {};
    fechas.forEach((f: string) => (conteo[f] = (conteo[f] || 0) + 1));
    if (!canvas) return;
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: Object.keys(conteo),
        datasets: [{
          label: 'Noticias por fecha',
          data: Object.values(conteo),
          borderColor: '#3cb371',
          backgroundColor: 'rgba(60,179,113,0.3)',
          fill: true,
          tension: 0.3
        }]
      }
    });
  });
</script>

<section class="tab-cronologia">
  <canvas bind:this={canvas}></canvas>
</section>

<style>
  .tab-cronologia {
    background: rgba(255,255,255,0.6);
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    padding: 1rem;
    backdrop-filter: blur(10px);
  }
  canvas { width: 100% !important; height: 300px !important; }
</style>