import { writable } from 'svelte/store';

export type Toast = { id: string; text: string; type?: 'info' | 'success' | 'error' };

const { subscribe, update } = writable<Toast[]>([]);

function addToast(text: string, type: Toast['type'] = 'info', ttl = 4000) {
  const id = crypto.randomUUID();
  update((t) => [...t, { id, text, type }]);
  setTimeout(() => removeToast(id), ttl);
  return id;
}

function removeToast(id: string) {
  update((t) => t.filter((x) => x.id !== id));
}

export const toasts = { subscribe };
export const toastActions = { addToast, removeToast };
