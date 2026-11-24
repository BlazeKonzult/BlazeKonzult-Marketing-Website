import { db } from '../db';
import { Templates } from '../templates';
import { categories, questions, rules, templates } from './content';

/**
 * Idempotent seed. Inserts content that does not exist yet (by key/code/slug) and never
 * overwrites anything edited in the admin dashboard. `force` replaces seeded content.
 */
export async function seed(opts: { force?: boolean; publish?: boolean } = {}) {
  const out = { categories: 0, questions: 0, rules: 0, templates: 0, published: 0 };
  const upsert = async (table: string, keyCol: string, key: string, row: Record<string, unknown>) => {
    const id = await db.val<number>(`SELECT id FROM ${table} WHERE \`${keyCol}\` = ?`, [key]);
    if (id && !opts.force) return false;
    if (id) await db.update(table, row, 'id = ?', [id]);
    else await db.insert(table, { [keyCol]: key, ...row });
    return true;
  };
  for (const { key, ...data } of categories) if (await upsert('categories', 'key', key, { data: JSON.stringify(data) })) out.categories++;
  for (const { code, ...data } of questions) if (await upsert('questions', 'code', code, { status: 'published', data: JSON.stringify(data) })) out.questions++;
  for (const { code, ...data } of rules) if (await upsert('recommendation_rules', 'code', code, { active: 1, data: JSON.stringify(data) })) out.rules++;

  for (const t of templates) {
    let id = await db.val<number>('SELECT id FROM templates WHERE slug = ?', [t.slug]);
    if (id && !opts.force) continue;
    const data = JSON.stringify({ ...t.data, sort: t.sort });
    if (id) await db.update('templates', { data, deleted_at: null }, 'id = ?', [id]);
    else id = await db.insert('templates', { slug: t.slug, status: 'draft', data });
    await db.run('DELETE FROM template_questions WHERE template_id = ?', [id]);
    let sort = 0;
    for (const code of t.questions) {
      const qid = await db.val<number>('SELECT id FROM questions WHERE code = ?', [code]);
      if (!qid) throw new Error(`Seed template ${t.slug} references unknown question ${code}`);
      await db.run('INSERT IGNORE INTO template_questions (template_id, question_id, sort) VALUES (?, ?, ?)', [id, qid, (sort += 10)]);
    }
    out.templates++;
    if (opts.publish !== false) { const r = await Templates.publish(id!, null); if (r.changed) out.published++; }
  }
  return out;
}
