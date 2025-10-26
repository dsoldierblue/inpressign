<script lang="ts">
  export let selectedProjectName: string = '';
</script>

<header class="app-header">
  <div class="title">InPressign</div>
  {#if selectedProjectName}
    <div class="badge">Proyecto: {selectedProjectName}</div>
  {/if}
</header>

<style>
  .app-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.5rem; background: rgba(60,179,113,0.85); color:white; border-radius: 8px }
  .title { font-weight:700; font-size:1.2rem }
  .badge { background: rgba(255,255,255,0.15); padding:0.4rem 0.8rem; border-radius:8px }
</style>