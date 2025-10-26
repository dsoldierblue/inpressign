// Helper to detect runtime environment
function isTauri() {
  try { return typeof window !== 'undefined' && !!(window as any).__TAURI__; } catch (e) { return false; }
}

// If running under Tauri we use the plugin; otherwise we fall back to localStorage-backed simple store.
let tauriDb: any = null;

async function ensureTauriDb(): Promise<any> {
  if (!tauriDb) {
    // dynamic import so svelte-check / browser bundlers don't attempt to load the plugin at build time
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { Database } = await import('@tauri-apps/plugin-sql');
    tauriDb = await Database.load('sqlite:inpressign.db');

    await tauriDb.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        created_at TEXT,
        updated_at TEXT,
        hash TEXT
      );
    `);

    await tauriDb.execute(`
      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        title TEXT,
        author TEXT,
        source TEXT,
        section TEXT,
        published_at TEXT,
        imported_at TEXT,
        hash TEXT,
        keywords TEXT,
        metadata TEXT,
        seo_score REAL,
        bias_score REAL,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    await tauriDb.execute(`
      CREATE TABLE IF NOT EXISTS trace_log (
        id TEXT PRIMARY KEY,
        event TEXT,
        entity_type TEXT,
        entity_id TEXT,
        timestamp TEXT,
        details TEXT
      );
    `);

    await tauriDb.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_hash ON projects(hash);`);
    await tauriDb.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_news_hash ON news(hash);`);
      // Migrate any localStorage-stored data created during browser development into the
      // Tauri-backed SQLite DB on first initialization.
      try {
        const migrated = (typeof window !== 'undefined' && window.localStorage?.getItem('inpressign.migrated')) || null;
        if (!migrated) {
          const localProjects = readLocal('inpressign.projects');
          if (Array.isArray(localProjects) && localProjects.length) {
            for (const p of localProjects.reverse()) {
              try {
                // Use INSERT OR IGNORE to avoid duplicate hash/id conflicts
                await tauriDb.execute(
                  'INSERT OR IGNORE INTO projects (id, name, description, created_at, updated_at, hash) VALUES (?, ?, ?, ?, ?, ?)',
                  [p.id || crypto.randomUUID(), p.name || '', p.description || '', p.created_at || new Date().toISOString(), p.updated_at || new Date().toISOString(), p.hash || '']
                );
              } catch (e) {
                // swallow individual insert errors
                console.warn('migrate project failed', e);
              }
            }
          }

          const localNews = readLocal('inpressign.news');
          if (Array.isArray(localNews) && localNews.length) {
            for (const n of localNews.reverse()) {
              try {
                await tauriDb.execute(
                  `INSERT OR IGNORE INTO news (
                    id, project_id, title, author, source, section,
                    published_at, imported_at, hash, keywords, metadata,
                    seo_score, bias_score
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [n.id || crypto.randomUUID(), n.project_id || null, n.title || '', n.author || '', n.source || '', n.section || '', n.published_at || '', n.imported_at || new Date().toISOString(), n.hash || '', JSON.stringify(n.keywords || []), JSON.stringify(n.metadata || {}), n.seo_score || 0, n.bias_score || 0]
                );
              } catch (e) {
                console.warn('migrate news failed', e);
              }
            }
          }

          const localTrace = readLocal('inpressign.trace');
          if (Array.isArray(localTrace) && localTrace.length) {
            for (const t of localTrace.reverse()) {
              try {
                await tauriDb.execute(
                  'INSERT OR IGNORE INTO trace_log (id, event, entity_type, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)',
                  [t.id || crypto.randomUUID(), t.event || '', t.entity_type || '', t.entity_id || '', t.timestamp || new Date().toISOString(), JSON.stringify(t.details || {})]
                );
              } catch (e) {
                console.warn('migrate trace failed', e);
              }
            }
          }

          // mark migrated so we don't attempt again
          try { window.localStorage.setItem('inpressign.migrated', '1'); } catch (e) {}
        }
      } catch (e) {
        // localStorage may be unavailable in some contexts; ignore migration errors
        console.warn('migration check failed', e);
      }
  }
  return tauriDb;
}

// Local fallback storage helpers (simple JSON blobs). Keeps same surface for create/list operations.
function readLocal(key: string) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}
function writeLocal(key: string, value: any) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }

export async function initDB(): Promise<void> {
  if (isTauri()) {
    await ensureTauriDb();
    return;
  }
  // browser: nothing to init for localStorage fallback
  return;
}

export async function createProject(name: string, description: string, hash: string): Promise<void> {
  if (isTauri()) {
    const db = await ensureTauriDb();
    const now = new Date().toISOString();
    await db.execute(
      'INSERT INTO projects (id, name, description, created_at, updated_at, hash) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), name, description, now, now, hash]
    );
    await logTrace('CREATE_PROJECT', 'project', name, { name, hash });
    return;
  }

  // local fallback
  const projects = readLocal('inpressign.projects');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  projects.unshift({ id, name, description, created_at: now, updated_at: now, hash });
  writeLocal('inpressign.projects', projects);
  await logTrace('CREATE_PROJECT', 'project', id, { name, hash });
}

export async function listProjects(): Promise<any[]> {
  if (isTauri()) {
    const db = await ensureTauriDb();
    return db.select('SELECT * FROM projects ORDER BY created_at DESC');
  }
  return readLocal('inpressign.projects');
}

export interface NewsInput {
  project_id: string;
  title: string;
  author: string;
  source: string;
  section: string;
  published_at: string;
  keywords: string[];
  metadata: Record<string, any>;
  seo_score: number;
  bias_score: number;
  hash: string;
}

export async function addNews({
  project_id,
  title,
  author,
  source,
  section,
  published_at,
  keywords,
  metadata,
  seo_score,
  bias_score,
  hash
}: NewsInput): Promise<void> {
  if (isTauri()) {
    const db = await ensureTauriDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.execute(
      `INSERT INTO news (
        id, project_id, title, author, source, section,
        published_at, imported_at, hash, keywords, metadata,
        seo_score, bias_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, project_id, title, author, source, section,
        published_at, now, hash, JSON.stringify(keywords),
        JSON.stringify(metadata), seo_score, bias_score
      ]
    );
    await logTrace('ADD_NEWS', 'news', id, { title, project_id, hash });
    return;
  }

  // local fallback
  const news = readLocal('inpressign.news');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  news.unshift({ id, project_id, title, author, source, section, published_at, imported_at: now, hash, keywords, metadata, seo_score, bias_score });
  writeLocal('inpressign.news', news);
  await logTrace('ADD_NEWS', 'news', id, { title, project_id, hash });
}

export async function listNews(project_id: string): Promise<any[]> {
  if (isTauri()) {
    const db = await ensureTauriDb();
    return db.select('SELECT * FROM news WHERE project_id = ? ORDER BY published_at DESC', [project_id]);
  }
  const all = readLocal('inpressign.news');
  return (all || []).filter((n:any)=>n.project_id===project_id).sort((a:any,b:any)=> (b.published_at||'').localeCompare(a.published_at||''));
}

export async function logTrace(
  event: string,
  entity_type: string,
  entity_id: string,
  details: Record<string, any> = {}
): Promise<void> {
  if (isTauri()) {
    const db = await ensureTauriDb();
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    await db.execute(
      'INSERT INTO trace_log (id, event, entity_type, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)',
      [id, event, entity_type, entity_id, timestamp, JSON.stringify(details)]
    );
    return;
  }

  const traces = readLocal('inpressign.trace') || [];
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  traces.unshift({ id, event, entity_type, entity_id, timestamp, details });
  writeLocal('inpressign.trace', traces);
}

export async function listTrace(entity_id: string): Promise<any[]> {
  if (isTauri()) {
    const db = await ensureTauriDb();
    return db.select('SELECT * FROM trace_log WHERE entity_id = ? ORDER BY timestamp DESC', [entity_id]);
  }
  const all = readLocal('inpressign.trace');
  return (all || []).filter((t:any)=>t.entity_id===entity_id).sort((a:any,b:any)=> (b.timestamp||'').localeCompare(a.timestamp||''));
}