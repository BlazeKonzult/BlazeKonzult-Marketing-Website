import fs from 'fs';
import path from 'path';
import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from './config';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const c = loadConfig().db;
  pool = mysql.createPool({
    host: c.host, port: c.port, database: c.name, user: c.user, password: c.pass,
    connectionLimit: c.connectionLimit, charset: 'utf8mb4', timezone: 'Z', dateStrings: true,
    multipleStatements: false, supportBigNumbers: true, decimalNumbers: true,
  });
  pool.on('connection', (conn) => { conn.query("SET time_zone = '+00:00'"); });
  return pool;
}

export async function closePool(): Promise<void> { if (pool) { await pool.end(); pool = null; } }

type Exec = Pool | PoolConnection;
export type Row = Record<string, any>;

export const db = {
  async all<T = Row>(sql: string, params: unknown[] = [], cx: Exec = getPool()): Promise<T[]> {
    const [rows] = await cx.execute<RowDataPacket[]>(sql, params as any[]);
    return rows as T[];
  },
  async one<T = Row>(sql: string, params: unknown[] = [], cx: Exec = getPool()): Promise<T | null> {
    const rows = await db.all<T>(sql, params, cx);
    return rows[0] ?? null;
  },
  async val<T = any>(sql: string, params: unknown[] = [], cx: Exec = getPool()): Promise<T | null> {
    const r = await db.one<Row>(sql, params, cx);
    return r ? (Object.values(r)[0] as T) : null;
  },
  async run(sql: string, params: unknown[] = [], cx: Exec = getPool()): Promise<ResultSetHeader> {
    const [r] = await cx.execute<ResultSetHeader>(sql, params as any[]);
    return r;
  },
  async insert(table: string, row: Row, cx: Exec = getPool()): Promise<number> {
    const cols = Object.keys(row);
    const r = await db.run(`INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
      cols.map((c) => row[c] ?? null), cx);
    return r.insertId;
  },
  async update(table: string, row: Row, where: string, params: unknown[] = [], cx: Exec = getPool()): Promise<number> {
    const cols = Object.keys(row);
    const r = await db.run(`UPDATE \`${table}\` SET ${cols.map((c) => `\`${c}\` = ?`).join(', ')} WHERE ${where}`,
      [...cols.map((c) => row[c] ?? null), ...params], cx);
    return r.affectedRows;
  },
  async tx<T>(fn: (cx: PoolConnection) => Promise<T>): Promise<T> {
    const cx = await getPool().getConnection();
    try {
      await cx.beginTransaction();
      const r = await fn(cx);
      await cx.commit();
      return r;
    } catch (e) {
      await cx.rollback();
      throw e;
    } finally {
      cx.release();
    }
  },
};

export function now(offsetSeconds = 0): string {
  return new Date(Date.now() + offsetSeconds * 1000).toISOString().slice(0, 19).replace('T', ' ');
}

export async function migrate(): Promise<void> {
  const file = [path.join(__dirname, 'schema.sql'), path.join(__dirname, '../src/schema.sql')].find((f) => fs.existsSync(f))!;
  const sql = fs.readFileSync(file, 'utf8').replace(/^--.*$/gm, '');
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) await getPool().query(stmt);
  // Columns added after the first release (CREATE TABLE IF NOT EXISTS does not add them to existing tables).
  for (const [table, column, ddl] of ADDED_COLUMNS) {
    const has = await db.val('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [table, column]);
    if (!Number(has)) await getPool().query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  }
}

const ADDED_COLUMNS: [string, string, string][] = [
  ['leads', 'next_follow_up_at', '`next_follow_up_at` DATETIME NULL'],
  ['leads', 'last_contacted_at', '`last_contacted_at` DATETIME NULL'],
  ['admin_sessions', 'label', '`label` VARCHAR(190) NULL'],
];
