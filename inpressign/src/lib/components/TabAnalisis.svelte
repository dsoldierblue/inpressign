<script lang="ts">
  import * as db from '../utils/db';
  import { onMount } from 'svelte';
  type Resultado = { name: string; sesgo: number; seo: number };
  let resultados: Resultado[] = [];

  function analizar(doc: { filename: string }) {
    return {
      name: doc.filename,
      sesgo: Math.floor(Math.random() * 101),
      seo: Math.floor(Math.random() * 101)
    } as Resultado;
  }

  onMount(async () => {
    const docs = typeof (db as any).listDocuments === "function" ? await (db as any).listDocuments() : [];
    resultados = (docs || []).map(analizar);
  });
</script>

<section class="analisis">
  {#if resultados.length === 0}
    <p>No hay documentos para analizar.</p>
  {:else}
    {#each resultados as r}
      <article class="card">
        <h4>{r.name}</h4>
        <div class="bar">
          <span>Sesgo {r.sesgo}%</span>
          <div class="fill sesgo" style="width:{r.sesgo}%"></div>
        </div>
        <div class="bar">
          <span>SEO {r.seo}%</span>
          <div class="fill seo" style="width:{r.seo}%"></div>
        </div>
      </article>
    {/each}
  {/if}
</section>

<style>
  .card {
    background: rgba(255,255,255,0.6);
    border-radius: 14px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .bar {
    background: rgba(60,179,113,0.15);
    border-radius: 10px;
    overflow: hidden;
    margin: 0.5rem 0;
    height: 16px;
    position: relative;
  }
  .fill {
    height: 100%;
    transition: width 0.6s ease;
  }
  .fill.sesgo { background: #3cb371; }
  .fill.seo { background: #2e8b57; }
  span { font-size: 0.85rem; font-weight: 600; }
</style>