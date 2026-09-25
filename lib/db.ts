import "server-only";

// Production (Vercel): Neon Postgres over HTTP, configured through DATABASE_URL
// (added automatically when you connect a Neon database in the Vercel dashboard).
// Local development without DATABASE_URL: an embedded Postgres (PGlite) stored in ./.data.

type Row = Record<string, unknown>;
export type Query = <T extends Row = Row>(text: string, params?: unknown[]) => Promise<T[]>;

const SCHEMA = `
create table if not exists kv (
  key text primary key,
  value jsonb not null
);
create table if not exists entries (
  id text primary key,
  date text not null,
  type text not null,
  start_time text,
  end_time text,
  break_minutes integer not null default 0,
  hours double precision,
  note text not null default '',
  status text not null default 'pending',
  created_by text not null,
  created_at text not null
);
create index if not exists entries_date on entries (date);
create table if not exists events (
  id text primary key,
  title text not null,
  start_date text not null,
  end_date text not null,
  start_time text,
  end_time text,
  category text not null,
  child_ids jsonb not null default '[]',
  repeat text not null default 'none',
  repeat_until text,
  note text not null default '',
  created_by text not null
);
create index if not exists events_dates on events (start_date, end_date);
create table if not exists schedule_items (
  id text primary key,
  child_id text not null,
  weekday integer not null,
  start_time text not null,
  end_time text not null,
  title text not null,
  kind text not null,
  location text not null default '',
  note text not null default ''
);
`;

// Kept on globalThis so every route bundle in the same process shares one connection
// (two PGlite instances on the same directory would not see each other's writes).
const g = globalThis as { __nestDb?: Promise<Query> | null };

async function connect(): Promise<Query> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  let query: Query;
  let exec: (sql: string) => Promise<unknown>;

  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    query = async (text, params = []) => (await sql.query(text, params)) as never;
    exec = async (script) => {
      for (const stmt of script.split(";").map((s) => s.trim()).filter(Boolean)) await sql.query(stmt);
    };
  } else {
    if (process.env.VERCEL) {
      throw new Error("DATABASE_URL is not set. Connect a Neon Postgres database to this Vercel project (Storage tab).");
    }
    const { PGlite } = await import("@electric-sql/pglite");
    const { mkdirSync } = await import("node:fs");
    mkdirSync(".data", { recursive: true });
    const db = new PGlite(".data/pglite");
    query = async (text, params = []) => (await db.query(text, params)).rows as never;
    exec = (script) => db.exec(script);
  }

  await exec(SCHEMA);
  return query;
}

export async function db(): Promise<Query> {
  if (!g.__nestDb) {
    g.__nestDb = connect().catch((err) => {
      g.__nestDb = null;
      throw err;
    });
  }
  return g.__nestDb;
}
