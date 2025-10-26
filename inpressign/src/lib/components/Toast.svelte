<script lang="ts">
  import { toasts } from '../stores/toasts';
  import { fly } from 'svelte/transition';
  export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';
</script>

<style>
  .toasts { position: fixed; z-index: 9999; pointer-events: none; }
  .top-right { top: 1rem; right: 1rem; }
  .top-left { top: 1rem; left: 1rem; }
  .bottom-right { bottom: 1rem; right: 1rem; }
  .bottom-left { bottom: 1rem; left: 1rem; }
  .toast { background: rgba(0,0,0,0.75); color: white; padding: 0.6rem 0.9rem; border-radius: 6px; margin: 0.4rem 0; pointer-events: auto; }
  .toast.success { background: #16a34a; }
  .toast.error { background: #dc2626; }
</style>

<div class="toasts {position}">
  {#each $toasts as t (t.id)}
    <div class="toast {t.type}" in:fly={{ y: -8, duration: 160 }} out:fly={{ y: -8, duration: 160 }}>
      {t.text}
    </div>
  {/each}
</div>
