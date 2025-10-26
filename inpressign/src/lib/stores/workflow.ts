import { writable } from 'svelte/store';

export type ContentBlock = { id: string; type: 'text'|'quote'|'data'; text: string; tags: string[] };
export type Person = {
  id: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  notes?: string;
  roles?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  birthDate?: string;
  deathDate?: string;
};
export type Question = { id: string; text: string; linkedPeople: string[]; linkedTags: string[]; linkedBlocks: string[] };
export type Node = { id: string; label: string; type: string; x?: number; y?: number };
export type Link = { id: string; from: string; to: string };

export type WorkflowState = {
  project: { id: string; name: string; authors: string[] } | null;
  contents: ContentBlock[];
  people: Person[];
  questions: Question[];
  nodes: { nodes: Node[]; links: Link[] };
  // adjust links type to include ids
  draft: string;
}

const defaultState: WorkflowState = {
  project: null,
  contents: [],
  people: [],
  questions: [],
  nodes: { nodes: [], links: [] },
  draft: ''
};

function fromStorage() {
  try {
    const raw = localStorage.getItem('workflow.state');
    if (raw) return JSON.parse(raw) as WorkflowState;
  } catch(e){/* ignore */}
  return defaultState;
}

const { subscribe, set, update } = writable<WorkflowState>(fromStorage());

subscribe((v) => {
  try { localStorage.setItem('workflow.state', JSON.stringify(v)); } catch(e){}
});

function reset() { set(defaultState); }

function setProject(name: string, authors: string[]) {
  update(s => ({ ...s, project: { id: crypto.randomUUID(), name, authors } }));
}

function addContent(type: ContentBlock['type'], text = '', tags: string[] = []) {
  const block: ContentBlock = { id: crypto.randomUUID(), type, text, tags };
  update(s => {
    const node = { id: block.id, label: (text || '').slice(0,60), type: 'content', x: Math.random()*800 + 20, y: Math.random()*300 + 20 } as Node;
    const nodes = [...s.nodes.nodes, node];
    return { ...s, contents: [...s.contents, block], nodes: { ...s.nodes, nodes } };
  });
  return block;
}

function updateContent(id: string, patch: Partial<ContentBlock>) {
  update(s => ({ ...s, contents: s.contents.map(c => c.id === id ? { ...c, ...patch } : c) }));
}

function removeContent(id: string) { update(s => ({ ...s, contents: s.contents.filter(c => c.id !== id) })); }

function addPerson(p: Omit<Person,'id'>) {
  const person = { ...p, id: crypto.randomUUID() } as Person;
  update(s => {
    const label = `${person.firstName || ''} ${person.lastName || ''}`.trim() || (person.metadata && (person.metadata.name || person.metadata.label)) || `Persona ${person.id.slice(0,6)}`;
    const node = { id: person.id, label, type: 'person', x: Math.random()*800 + 20, y: Math.random()*300 + 20 } as Node;
    const nodes = [...s.nodes.nodes, node];
    return { ...s, people: [...s.people, person], nodes: { ...s.nodes, nodes } };
  });
  return person;
}
function updatePerson(id: string, patch: Partial<Person>) { update(s => {
  const people = s.people.map(p => p.id===id?{...p,...patch}:p);
  // also update node label if name changed
  const person = people.find(p=>p.id===id);
  const nodes = s.nodes.nodes.map(n => n.id===id ? { ...n, label: person ? ((person.firstName || person.lastName) ? `${person.firstName || ''} ${person.lastName || ''}`.trim() : (person.metadata && (person.metadata.name || person.metadata.label)) || n.label) : n.label } : n);
  return { ...s, people, nodes: { ...s.nodes, nodes } };
}); }
function removePerson(id: string) { update(s => ({ ...s, people: s.people.filter(p=>p.id!==id) })); }

function addQuestion(text: string) { const q: Question = { id: crypto.randomUUID(), text, linkedPeople: [], linkedTags: [], linkedBlocks: [] }; update(s=>{
  const node = { id: q.id, label: text.slice(0,60), type: 'question', x: Math.random()*800 + 20, y: Math.random()*300 + 20 } as Node;
  const nodes = [...s.nodes.nodes, node];
  return {...s, questions:[...s.questions,q], nodes: { ...s.nodes, nodes } };
}); return q; }
function linkQuestion(qid: string, opts: Partial<Question>) { update(s=>({...s, questions:s.questions.map(q=>q.id===qid?{...q,...opts}:q)})); }

function addNode(label: string, type = 'manual', id?: string) {
  const nid = id || crypto.randomUUID();
  const node = { id: nid, label: label.slice(0,60), type, x: Math.random()*800 + 20, y: Math.random()*300 + 20 } as Node;
  update(s=>({ ...s, nodes: { ...s.nodes, nodes: [...s.nodes.nodes, node] } }));
  return node;
}

function addLink(from: string, to: string) {
  const lid = crypto.randomUUID();
  update(s=>({ ...s, nodes: { ...s.nodes, links: [...s.nodes.links, { id: lid, from, to }] } }));
  return { id: lid, from, to };
}

function setNodePosition(id: string, x: number, y: number) {
  update(s=>({ ...s, nodes: { ...s.nodes, nodes: s.nodes.nodes.map(n=> n.id===id?{...n, x, y}: n) } }));
}

function setDraft(txt: string) { update(s=>({...s, draft: txt})); }

export const workflow = {
  subscribe,
  reset,
  setProject,
  addContent,
  updateContent,
  removeContent,
  addPerson,
  updatePerson,
  removePerson,
  addQuestion,
  linkQuestion,
  addNode,
  addLink,
  setNodePosition,
  setDraft
};

export default workflow;
