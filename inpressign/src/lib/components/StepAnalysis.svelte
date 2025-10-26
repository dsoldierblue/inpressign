<script lang="ts">
  import { onMount } from 'svelte';
  import { toastActions } from '../stores/toasts';
  import workflow from '../stores/workflow';
  // NLP / SEO libraries will be loaded dynamically at runtime to avoid bundling/resolution errors
  let Sentiment: any = null;
  let nlp: any = null;
  let keyword_extractor: any = null;
  let fk: any = null;
  let removeStopwords: any = null;

  async function ensureNLP() {
    if (Sentiment && keyword_extractor && fk && removeStopwords) return;
    try {
      // Use indirect dynamic import (new Function) to avoid TypeScript/Vite static analysis warnings
      const p = (name: string) => new Function(`return import("${name}")`)().catch(() => null);
      const [sMod, nMod, kMod, fkMod, swMod] = await Promise.all([
        p('sentiment'),
        p('compromise'),
        p('keyword-extractor'),
        p('flesch-kincaid'),
        p('stopword')
      ]);
      Sentiment = sMod ? (sMod.default ?? sMod) : null;
      nlp = nMod ? (nMod.default ?? nMod) : null;
      keyword_extractor = kMod ? (kMod.default ?? kMod) : null;
      fk = fkMod ? (fkMod.default ?? fkMod) : null;
      removeStopwords = swMod ? (swMod.default ?? swMod) : null;
    } catch (e) {
      console.warn('Failed to dynamically load NLP libs', e);
    }
  }

  // Fallback rule-based sentiment (used when Sentiment lib can't load)
  const FALLBACK_POS = ['bueno','positivo','apoya','apoyo','beneficio','beneficioso','confirmado','verificado','exitoso','mejor'];
  const FALLBACK_NEG = ['malo','negativo','acusación','alega','alegado','no confirmado','controversia','falla','falló','errores','problem'];
  function fallbackSentimentScore(t: string) {
    const lower = (t||'').toLowerCase();
    let score = 0;
    for (const p of FALLBACK_POS) if (lower.includes(p)) score += 2;
    for (const n of FALLBACK_NEG) if (lower.includes(n)) score -= 2;
    return score; // unbounded small int, approximate to sentiment
  }

  export const title = 'Análisis y verificación';
  export const currentProjectId: string = 'default';
  let text = '';
  let bias = 0; // 0..100 (lower = more negative / uncertain, higher = positive/confirmed)
  let seo = 0;  // 0..100
  let readGrade = 0;
  let keywords: string[] = [];
  let suggestions: string[] = [];
  let hasProject = false;

  async function analyze() {
    if (!text || text.trim().length < 20) { toastActions.addToast('Texto demasiado corto para análisis', 'error'); return; }
    await ensureNLP();
    // sentiment analysis - prefer library, fallback to simple rule-based
    let sres: any = { score: 0 };
    if (Sentiment) {
      const sentimentInst = new Sentiment();
      sres = sentimentInst.analyze(text as string);
    } else {
      sres.score = fallbackSentimentScore(text as string);
      // map fallback to similar - clamp to -10..10
      sres.score = Math.max(-10, Math.min(10, sres.score));
    }
    // sres.score can be negative/positive; map to 0..100
    const sentScore = Math.max(-10, Math.min(10, sres.score));
    const sentNorm = Math.round((sentScore + 10) * 5); // map -10..10 to 0..100

    // hedging / uncertainty detection (simple heuristics)
    const hedges = ['puede', 'podría', 'posible', 'posiblemente', 'sugiere', 'sugieren', 'señala', 'aparentemente', 'según', 'supuesto', 'supuestamente', 'allegado', 'alegado', 'no confirmado', 'presuntamente'];
    const lower = text.toLowerCase();
    let hedgeCount = 0;
    for (const h of hedges) if (lower.includes(h)) hedgeCount++;

    // charged words detection (loaded language)
    const charged = ['asesino','corrupción','escándalo','crimen','fraude','terrorista','extorsión','violento','delito'];
    let chargedCount = 0;
    for (const c of charged) if (lower.includes(c)) chargedCount++;

    // bias score: combine sentiment certainty, hedge density and charged language
    // more hedges -> lower confidence; more charged words -> possible bias
    const hedgePenalty = Math.min(30, hedgeCount * 6);
    const chargedPenalty = Math.min(30, chargedCount * 10);
    bias = Math.max(0, Math.min(100, sentNorm - hedgePenalty - chargedPenalty));

    // SEO: keyword density, length, and readability
    const words = (text.match(/\w+/g) || []).length;
    const extractorOpts = { language: 'spanish', remove_digits: true, return_changed_case: true, remove_duplicates: false };
  const rawKeywords = keyword_extractor.extract(text, extractorOpts) as string[];
  // filter stopwords and short words
  const filtered = (removeStopwords(rawKeywords) as string[]).filter((w: string) => w.length > 3);
  // take top uniques
  const unique = Array.from(new Set(filtered)).slice(0,10) as string[];
    keywords = unique;

    // readability via flesch-kincaid (approx English; for Spanish it's approximate) - use word/sentence statistics
    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const fkWords = words;
    const syllables = estimateSyllables(text);
    const fkScore = fk ? fk({ syllables, words: fkWords, sentences }) : Math.max(0, Math.min(20, (fkWords / sentences) / 20));
    readGrade = Math.round(fkScore);

    // SEO heuristic combining length, keywords and readability
    const lengthScore = Math.min(40, Math.floor(Math.min(40, (words/500)*40)));
    const keywordScore = Math.min(40, unique.length * 4);
    const readabilityScore = Math.max(0, Math.min(20, 20 - Math.abs(readGrade - 8))); // best around grade 8
    seo = Math.max(0, Math.min(100, lengthScore + keywordScore + readabilityScore));

    // suggestions
    suggestions = [];
    if (bias < 40) suggestions.push('Revisa el uso de lenguaje tentativo y verifica fuentes primarias para reducir incertidumbre.');
    if (chargedCount > 0) suggestions.push('Atiende el lenguaje cargado; neutraliza términos o aporta contexto y evidencia.');
    if (seo < 50) suggestions.push('Aumenta la presencia de keywords relevantes y mejora la legibilidad (párrafos más cortos, frases activas).');
    if (readGrade > 12) suggestions.push('Reduce la complejidad: frases más cortas y lenguaje claro para mejor alcance.');

    toastActions.addToast('Análisis ejecutado (usando librerías locales)', 'success');
  }

  // lightweight syllable estimator (Spanish-friendly heuristic)
  function estimateSyllables(text: string) {
    const words = (text || '').toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
    let s = 0;
    for (const w of words) {
      // count vowel groups
      const groups = w.match(/[aeiouáéíóúü]+/g);
      s += groups ? groups.length : 1;
    }
    return s || Math.max(1, (text.match(/\w+/g) || []).length * 1.5);
  }

  onMount(() => {
    const unsub = workflow.subscribe(s=>{ hasProject = !!s.project; });
    const saved = localStorage.getItem('workflow.analysis.text');
    if (saved) text = saved;
    return unsub;
  });

  function save() {
    if (!hasProject) { toastActions.addToast('Crea un proyecto antes de guardar análisis', 'error'); return; }
    workflow.addContent('data', text, ['analysis']);
    localStorage.setItem('workflow.analysis.text', text);
    toastActions.addToast('Análisis guardado', 'success');
  }

  // No external neural models (TensorFlow) are used — analysis relies on JS libraries only.

  // --- Heuristic checks for gender/race bias and counterfactuals ---
  let enableBiasChecks = true;
  const genderMale = ['hombre','hombres','señor','señores','masculino','él','ellos'];
  const genderFemale = ['mujer','mujeres','señora','señoras','femenino','ella','ellas'];
  const raceTerms = ['negro','negra','blanco','blanca','indígena','afroamericano','asiático','árabe','latino','latina'];

  let biasReport: { type: string; count: number; details?: string }[] = [];

  async function runBiasChecks() {
    if (!text || text.trim().length < 10) { toastActions.addToast('Texto demasiado corto para chequear sesgos', 'error'); return; }
    biasReport = [];
    const lower = text.toLowerCase();
    const maleCount = genderMale.reduce((acc, w) => acc + (lower.split(w).length - 1), 0);
    const femaleCount = genderFemale.reduce((acc, w) => acc + (lower.split(w).length - 1), 0);
    const raceCount = raceTerms.reduce((acc, w) => acc + (lower.split(w).length - 1), 0);
    if (maleCount || femaleCount) biasReport.push({ type: 'gender-mentions', count: maleCount + femaleCount, details: `Masculino:${maleCount} Femenino:${femaleCount}` });
    if (raceCount) biasReport.push({ type: 'race-mentions', count: raceCount, details: `Términos detectados: ${raceCount}` });

    // Counterfactual check: swap common gendered terms and re-run sentiment/toxicity
    const counterfactuals = [
      { from: genderMale, to: genderFemale },
      { from: genderFemale, to: genderMale }
    ];
    for (const cf of counterfactuals) {
      let alt = text;
      cf.from.forEach((w,i)=>{
        const replacement = cf.to[i] || cf.to[0] || '';
        const re = new RegExp(`\\b${w}\\b`,'gi');
        alt = alt.replace(re, replacement);
      });
        // compare sentiment (prefer library, fallback to rule-based)
        await ensureNLP();
        let base = 0;
        let altScore = 0;
        if (Sentiment) {
          const sentimentInst = new Sentiment();
          base = sentimentInst.analyze(text).score;
          altScore = sentimentInst.analyze(alt).score;
        } else {
          base = fallbackSentimentScore(text);
          altScore = fallbackSentimentScore(alt);
        }
      const diff = Math.abs(base - altScore);
      if (diff >= 2) {
        biasReport.push({ type: 'counterfactual-gender', count: diff, details: `Diferencia de sentimiento detectada: ${diff}` });
      }
        // No toxicity model comparison — rely on sentiment deltas and heuristics only
    }

    if (biasReport.length === 0) {
      toastActions.addToast('No se detectaron indicadores rápidos de sesgo en el texto', 'success');
    } else {
      toastActions.addToast('Chequeo de sesgos completado', 'info');
    }
  }
</script>

<section class="step">
  <h2>Análisis y verificación</h2>
  <textarea placeholder="Texto a analizar" bind:value={text}></textarea>
  <div class="actions">
  <button on:click={analyze}>Analizar (NLP)</button>
  <button on:click={save}>Guardar</button>
  </div>
  <div style="margin-top:0.6rem">
    <label><input type="checkbox" bind:checked={enableBiasChecks}> Habilitar chequeos de sesgo (género/raza)</label>
    <button on:click={runBiasChecks} style="margin-left:0.6rem">Ejecutar chequeos de sesgo</button>
  </div>
  <div class="metrics">
    <p>Sesgo (heurístico): {bias}%</p>
    <p>SEO: {seo}%</p>
    <p>Legibilidad (grado FK): {readGrade}</p>
    {#if biasReport && biasReport.length}
      <details style="margin-top:0.4rem"><summary>Reporte rápido de sesgo</summary>
        <ul>
          {#each biasReport as b}
            <li><strong>{b.type}</strong>: {b.count} {b.details ? ` — ${b.details}` : ''}</li>
          {/each}
        </ul>
      </details>
    {/if}
  </div>
</section>

<style>
  .step { background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 12px; }
  textarea { width: 100%; min-height: 160px; margin-top: 0.5rem }
  .actions { margin-top: 0.6rem }
  .metrics { margin-top: 1rem }
  button { background: #3cb371; color: white; border: none; padding: 0.5rem 0.8rem; border-radius: 8px; margin-right: 0.5rem }
</style>
