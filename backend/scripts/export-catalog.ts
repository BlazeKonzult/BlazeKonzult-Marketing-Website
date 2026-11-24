/**
 * Writes the build-time catalog used by the static website for SEO landing pages of the
 * built-in assessments (src/lib/assessment-catalog.json). Run after changing seed content:
 *   cd backend && npx tsx scripts/export-catalog.ts
 * Assessments created later in the admin dashboard work immediately through the hub and the
 * generic runner; they get a dedicated static landing page after the catalog is refreshed and the site rebuilt.
 */
import fs from 'fs';
import path from 'path';
import { categories, questions, templates } from '../src/seed/content';
import { estimateMinutes, Snapshot } from '../src/engine';
import { DEFAULTS } from '../src/settings';

const byCode = new Map(questions.map((q) => [q.code, q]));
const out = templates.map((t) => {
  const qs = t.questions.map((c) => byCode.get(c)!);
  const used = new Set(qs.map((q) => q.category));
  const snap = { template: { thresholds: DEFAULTS.thresholds }, questions: qs } as unknown as Snapshot;
  return {
    slug: t.slug, sort: t.sort, name: t.data.name, summary: t.data.summary, audience: t.data.audience, evaluates: t.data.evaluates, seo: t.data.seo,
    minutes: estimateMinutes(snap), questions: qs.length,
    categories: categories.filter((c) => used.has(c.key) && c.scored !== false).map((c) => ({ key: c.key, name: c.name, description: c.description })),
  };
});
const target = path.join(__dirname, '..', '..', 'src', 'lib', 'assessment-catalog.json');
fs.writeFileSync(target, JSON.stringify({ templates: out, thresholds: DEFAULTS.thresholds }, null, 2) + '\n');
console.log(`Wrote ${out.length} assessments to ${target}`);
