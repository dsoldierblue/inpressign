import Database from '@tauri-apps/plugin-sql';

interface DatabaseType {
  execute(query: string, args?: any[]): Promise<any>;
  select<T = any>(query: string, args?: any[]): Promise<T[]>;
}

let db: DatabaseType | null = null;

export async function initDB(): Promise<DatabaseType> {
  if (!db) {
    db = await Database.load('sqlite:inpressign.db');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        created_at TEXT,
        updated_at TEXT,
        hash TEXT
      );
    `);

    await db.execute(`
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

    await db.execute(`
      CREATE TABLE IF NOT EXISTS trace_log (
        id TEXT PRIMARY KEY,
        event TEXT,
        entity_type TEXT,
        entity_id TEXT,
        timestamp TEXT,
        details TEXT
      );
    `);

    // Índices opcionales para evitar duplicados y mejorar rendimiento
    await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_hash ON projects(hash);`);
    await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_news_hash ON news(hash);`);
  }

  return db;
}

export async function createProject(name: string, description: string, hash: string): Promise<void> {
  const db = await initDB();
  const now = new Date().toISOString();
  await db.execute(
    'INSERT INTO projects (id, name, description, created_at, updated_at, hash) VALUES (?, ?, ?, ?, ?, ?)',
    [crypto.randomUUID(), name, description, now, now, hash]
  );
  await logTrace('CREATE_PROJECT', 'project', name, { name, hash });
}

export async function listProjects(): Promise<any[]> {
  const db = await initDB();
  return db.select('SELECT * FROM projects ORDER BY created_at DESC');
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
  const db = await initDB();
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
}

export async function listNews(project_id: string): Promise<any[]> {
  const db = await initDB();
  return db.select(
    'SELECT * FROM news WHERE project_id = ? ORDER BY published_at DESC',
    [project_id]
  );
}

export async function logTrace(
  event: string,
  entity_type: string,
  entity_id: string,
  details: Record<string, any> = {}
): Promise<void> {
  const db = await initDB();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await db.execute(
    'INSERT INTO trace_log (id, event, entity_type, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)',
    [id, event, entity_type, entity_id, timestamp, JSON.stringify(details)]
  );
}

export async function listTrace(entity_id: string): Promise<any[]> {
  const db = await initDB();
  return db.select(
    'SELECT * FROM trace_log WHERE entity_id = ? ORDER BY timestamp DESC',
    [entity_id]
  );
}