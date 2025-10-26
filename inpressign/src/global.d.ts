// Global type additions for the project
// Declare the optional __TAURI__ property on window so Svelte components can check window.__TAURI__ safely

declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}

export {};
