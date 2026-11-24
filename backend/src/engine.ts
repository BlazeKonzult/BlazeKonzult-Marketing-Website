/**
 * Deterministic assessment engine: pure functions over a template SNAPSHOT and answers.
 * No database, no randomness, no external services: the same snapshot + answers always
 * produce the same result, which keeps historical results reproducible.
 *
 * Answer values:  maturity → 0..4 · yes_no → 'yes'|'no' · single → option value
 *                 multi → option value[] · number → numeric · any → 'na' | 'unsure'
 */
import { LStr, SCALE, Loc } from './i18n';
import type { Threshold } from './settings';

export type QType = 'maturity' | 'yes_no' | 'single' | 'multi' | 'number';
export type Risk = 'critical' | 'high' | 'medium' | 'low';
export type Option = { value: string | number; label: LStr; score?: number | null };
export type CondRule = { q: string; op: 'in' | 'not_in' | 'gte' | 'lte' | 'answered' | 'not_answered'; value?: unknown };
export type Condition = { mode?: 'all' | 'any'; rules: CondRule[] } | null;

export type Question = {
  code: string; category: string; type: QType;
  title: LStr; description?: LStr; help?: LStr;
  options?: Option[]; ranges?: { min: number; max: number; score: number | null }[]; min?: number; max?: number; unit?: LStr;
  allow_na?: boolean; allow_unsure?: boolean; required?: boolean; scored?: boolean; weight?: number;
  critical?: { max_score?: number; unsure?: boolean; finding?: LStr } | null;
  risk?: Risk; condition?: Condition; recommendations?: string[]; profile_key?: string;
};
export type Category = { key: string; name: LStr; description?: LStr; weight?: number; sort?: number; scored?: boolean };
export type TriggerCond =
  | { type: 'score_lte'; q: string; value: number }
  | { type: 'answer_in'; q: string; values: (string | number)[] }
  | { type: 'unsure'; q: string }
  | { type: 'gap'; q: string }
  | { type: 'category_lt'; category: string; value: number }
  | { type: 'mapped'; max_score?: number };
export type Rule = {
  code: string; priority: Risk; category: string; title: LStr; description: LStr; impact?: LStr; remediation?: LStr; timeframe?: LStr;
  service?: string | null; templates?: string[]; trigger: { mode?: 'any' | 'all'; conditions: TriggerCond[] };
};
export type Snapshot = {
  schema: number;
  template: {
    slug: string; name: LStr; summary: LStr; audience?: LStr; evaluates?: LStr[];
    settings: { unsure_policy: 'zero' | 'exclude'; strength_threshold: number; max_recommendations: number };
    thresholds: Threshold[];
  };
  categories: Category[]; questions: Question[]; rules: Rule[];
};
export type Answers = Record<string, unknown>;

export const MAX = 4;
export const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
export const TYPES: QType[] = ['maturity', 'yes_no', 'single', 'multi', 'number'];
const RISKS: Risk[] = ['critical', 'high', 'medium', 'low'];

const isBlank = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const strs = (v: unknown) => (Array.isArray(v) ? v : [v]).map((x) => String(x));

export const isRequired = (q: Question) => q.required !== false;
export const isScored = (q: Question) => q.scored !== false;
export const index = (s: Snapshot) => new Map(s.questions.map((q) => [q.code, q]));

export function options(q: Question): Option[] {
  if (q.options?.length) return q.options;
  if (q.type === 'maturity') return SCALE.map((label, i) => ({ value: i, score: i, label }));
  if (q.type === 'yes_no') return [{ value: 'yes', score: 4, label: { en: 'Yes', nl: 'Ja' } }, { value: 'no', score: 0, label: { en: 'No', nl: 'Nee' } }];
  return [];
}

/* ---------------------------- Visibility ---------------------------- */

function conditionMet(cond: Condition | undefined, answers: Answers, visible: Set<string>): boolean {
  if (!cond || !cond.rules?.length) return true;
  const res = cond.rules.map((r) => {
    const has = visible.has(r.q) && !isBlank(answers[r.q]);
    const a = has ? answers[r.q] : null;
    const vals = strs(r.value ?? []);
    switch (r.op) {
      case 'answered': return has;
      case 'not_answered': return !has;
      case 'in': return has && strs(a).some((x) => vals.includes(x));
      case 'not_in': return has && !strs(a).some((x) => vals.includes(x));
      case 'gte': return has && !isNaN(Number(a)) && Number(a) >= Number(r.value);
      case 'lte': return has && !isNaN(Number(a)) && Number(a) <= Number(r.value);
      default: return false;
    }
  });
  return (cond.mode ?? 'all') === 'any' ? res.includes(true) : !res.includes(false);
}

/** Visible question codes for these answers, in order. Conditions may only reference earlier questions. */
export function visible(s: Snapshot, answers: Answers): string[] {
  const vis = new Set<string>();
  for (const q of s.questions) if (conditionMet(q.condition, answers, vis)) vis.add(q.code);
  return [...vis];
}

/* ---------------------------- Validation ---------------------------- */

function checkValue(q: Question, v: unknown): string | null {
  if (v === 'na') return q.allow_na ? null : 'invalid';
  if (v === 'unsure') return q.allow_unsure ? null : 'invalid';
  const opts = options(q).map((o) => String(o.value));
  switch (q.type) {
    case 'maturity': { const n = Number(v); return Number.isInteger(n) && n >= 0 && n <= MAX && String(v).trim() !== '' ? null : 'invalid'; }
    case 'yes_no':
    case 'single': return (typeof v === 'string' || typeof v === 'number') && opts.includes(String(v)) ? null : 'invalid';
    case 'multi': return Array.isArray(v) && v.length <= 50 && v.every((x) => opts.includes(String(x))) ? null : 'invalid';
    case 'number': {
      const n = Number(v);
      if (typeof v === 'boolean' || String(v).trim() === '' || !Number.isFinite(n)) return 'invalid';
      if (q.min !== undefined && q.min !== null && n < q.min) return 'out_of_range';
      if (q.max !== undefined && q.max !== null && n > q.max) return 'out_of_range';
      return null;
    }
  }
  return 'invalid';
}

/** Server-side validation. Drops answers to unknown/hidden questions. Returns [clean, errors]. */
export function validate(s: Snapshot, answers: Answers): [Answers, Record<string, string>] {
  const idx = index(s);
  const known: Answers = {};
  for (const [k, v] of Object.entries(answers ?? {})) if (idx.has(k)) known[k] = v;
  const vis = visible(s, known);
  const out: Answers = {};
  const errors: Record<string, string> = {};
  for (const code of vis) {
    const q = idx.get(code)!;
    const v = known[code];
    if (isBlank(v)) { if (isRequired(q)) errors[code] = 'required'; continue; }
    const err = checkValue(q, v);
    if (err) { errors[code] = err; continue; }
    out[code] = Array.isArray(v) ? [...new Set(v.map(String))] : q.type === 'maturity' && v !== 'na' && v !== 'unsure' ? Number(v) : q.type === 'number' && v !== 'na' && v !== 'unsure' ? Number(v) : v;
  }
  return [out, errors];
}

/* ------------------------------ Scoring ------------------------------ */

/** Score 0..4 for one answer, or null when not scored (unscored question, N/A, unanswered, unscored option). */
export function questionScore(q: Question, v: unknown, unsurePolicy: 'zero' | 'exclude' = 'zero'): number | null {
  if (!isScored(q) || isBlank(v) || v === 'na') return null;
  if (v === 'unsure') return unsurePolicy === 'exclude' ? null : 0;
  switch (q.type) {
    case 'maturity': return Math.max(0, Math.min(MAX, Number(v)));
    case 'yes_no':
    case 'single': { const o = options(q).find((o) => String(o.value) === String(v)); return o && o.score !== undefined && o.score !== null ? Number(o.score) : null; }
    case 'multi': {
      const opts = options(q);
      const total = opts.reduce((a, o) => a + Math.max(0, Number(o.score ?? 0)), 0);
      if (total <= 0) return null;
      const sel = strs(v);
      const got = opts.filter((o) => sel.includes(String(o.value))).reduce((a, o) => a + Math.max(0, Number(o.score ?? 0)), 0);
      return Math.round(Math.min(MAX, (MAX * got) / total) * 10000) / 10000;
    }
    case 'number': {
      const n = Number(v);
      const r = (q.ranges ?? []).find((r) => n >= r.min && n <= r.max);
      return r && r.score !== null && r.score !== undefined ? Number(r.score) : null;
    }
  }
  return null;
}

export function classify(thresholds: Threshold[], score: number): { key: string; label: LStr } {
  const sorted = [...thresholds].sort((a, b) => a.min - b.min);
  let hit = sorted[0];
  for (const t of sorted) if (score >= t.min) hit = t;
  return { key: hit.key, label: hit.label };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export type CategoryResult = { key: string; name: LStr; score: number | null; level: { key: string; label: LStr } | null; applicable: number; answered: number; unsure: number; na: number; skipped: number };
export type Gap = { code: string; category: string; risk: Risk; title: LStr; question: LStr; answer: 'unsure' | 'low'; score: number | null };
export type RecOut = { code: string; priority: Risk; category: string; title: LStr; description: LStr; impact: LStr | null; remediation: LStr | null; timeframe: LStr | null; service: string | null };
export type Result = {
  engine: 1; overall: number | null; classification: { key: string; label: LStr } | null; coverage: number; uncertainty: number;
  counts: { applicable: number; answered: number; unsure: number; na: number; skipped: number };
  categories: CategoryResult[]; gaps: Gap[]; strengths: string[]; recommendations: RecOut[]; services: string[];
  profile: Record<string, unknown>; visible: string[];
};

export function evaluate(s: Snapshot, answers: Answers): Result {
  const t = s.template;
  const policy = t.settings?.unsure_policy ?? 'zero';
  const idx = index(s);
  const vis = visible(s, answers);
  type Acc = CategoryResult & { weight: number; num: number; den: number };
  const cats = new Map<string, Acc>();
  for (const c of s.categories) {
    if (c.scored === false) continue;
    cats.set(c.key, { key: c.key, name: c.name, weight: Number(c.weight ?? 1), num: 0, den: 0, score: null, level: null, applicable: 0, answered: 0, unsure: 0, na: 0, skipped: 0 });
  }
  const counts = { applicable: 0, answered: 0, unsure: 0, na: 0, skipped: 0 };
  const gaps: Gap[] = [];
  const qScores = new Map<string, number | null>();

  for (const code of vis) {
    const q = idx.get(code)!;
    const c = cats.get(q.category);
    if (!isScored(q) || !c) continue;
    const v = answers[code];
    if (v === 'na') { c.na++; counts.na++; continue; }
    c.applicable++; counts.applicable++;
    if (isBlank(v)) { c.skipped++; counts.skipped++; continue; }
    if (v === 'unsure') { c.unsure++; counts.unsure++; } else { c.answered++; counts.answered++; }
    const sc = questionScore(q, v, policy);
    qScores.set(code, sc);
    if (sc !== null) { const w = Number(q.weight ?? 1); c.num += (w * sc) / MAX; c.den += w; }
    if (q.critical) {
      const max = Number(q.critical.max_score ?? 1);
      const isGap = (v === 'unsure' && (q.critical.unsure ?? true)) || (v !== 'unsure' && sc !== null && sc <= max);
      if (isGap) gaps.push({ code, category: q.category, risk: q.risk ?? 'high', title: q.critical.finding ?? q.title, question: q.title, answer: v === 'unsure' ? 'unsure' : 'low', score: sc });
    }
  }

  let wSum = 0, wNum = 0;
  const catOut: CategoryResult[] = [];
  for (const c of cats.values()) {
    const score = c.den > 0 ? r1((100 * c.num) / c.den) : null;
    if (score !== null) { wSum += c.weight; wNum += c.weight * score; }
    catOut.push({ key: c.key, name: c.name, score, level: score === null ? null : classify(t.thresholds, score), applicable: c.applicable, answered: c.answered, unsure: c.unsure, na: c.na, skipped: c.skipped });
  }
  const overall = wSum > 0 ? r1(wNum / wSum) : null;
  const coverage = counts.applicable ? r1((100 * counts.answered) / counts.applicable) : 0;
  const uncertainty = counts.applicable ? r1((100 * counts.unsure) / counts.applicable) : 0;
  gaps.sort((a, b) => (PRIORITY_ORDER[a.risk] - PRIORITY_ORDER[b.risk]) || a.code.localeCompare(b.code));

  const strengthMin = Number(t.settings?.strength_threshold ?? 75);
  const strengths = catOut.filter((c) => c.score !== null && c.score >= strengthMin && c.unsure === 0).map((c) => c.key);
  const catScores = Object.fromEntries(catOut.map((c) => [c.key, c.score]));
  const recs = recommend(s, answers, vis, qScores, catScores, gaps);
  const services = [...new Set(recs.map((r) => r.service).filter(Boolean) as string[])];

  const profile: Record<string, unknown> = {};
  for (const q of s.questions) if (q.profile_key && vis.includes(q.code) && !isBlank(answers[q.code])) profile[q.profile_key] = answers[q.code];

  return { engine: 1, overall, classification: overall === null ? null : classify(t.thresholds, overall), coverage, uncertainty, counts, categories: catOut, gaps, strengths, recommendations: recs, services, profile, visible: vis };
}

/* -------------------------- Recommendations -------------------------- */

/** Rule-based matching: only rules triggered by the participant's own answers fire (no upselling). */
export function recommend(s: Snapshot, answers: Answers, vis: string[], qScores: Map<string, number | null>, catScores: Record<string, number | null>, gaps: Gap[]): RecOut[] {
  const visSet = new Set(vis);
  const gapSet = new Set(gaps.map((g) => g.code));
  const matched: Rule[] = [];
  for (const rule of s.rules ?? []) {
    if (rule.templates?.length && !rule.templates.includes(s.template.slug)) continue;
    const conds = rule.trigger?.conditions ?? [];
    if (!conds.length) continue;
    const res = conds.map((c) => {
      switch (c.type) {
        case 'score_lte': { const sc = qScores.get(c.q); return visSet.has(c.q) && sc !== undefined && sc !== null && answers[c.q] !== 'unsure' && sc <= Number(c.value); }
        case 'answer_in': return visSet.has(c.q) && !isBlank(answers[c.q]) && strs(answers[c.q]).some((x) => strs(c.values).includes(x));
        case 'unsure': return visSet.has(c.q) && answers[c.q] === 'unsure';
        case 'gap': return gapSet.has(c.q);
        case 'category_lt': { const sc = catScores[c.category]; return sc !== undefined && sc !== null && sc < Number(c.value); }
        case 'mapped': {
          const max = Number(c.max_score ?? 2);
          return s.questions.some((q) => visSet.has(q.code) && (q.recommendations ?? []).includes(rule.code) &&
            (answers[q.code] === 'unsure' || ((qScores.get(q.code) ?? null) !== null && (qScores.get(q.code) as number) <= max)));
        }
        default: return false;
      }
    });
    if ((rule.trigger.mode ?? 'any') === 'all' ? !res.includes(false) : res.includes(true)) matched.push(rule);
  }
  matched.sort((a, b) => (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    || ((catScores[a.category] ?? 101) - (catScores[b.category] ?? 101)) || a.code.localeCompare(b.code));
  return matched.slice(0, Number(s.template.settings?.max_recommendations ?? 8)).map((r) => ({
    code: r.code, priority: r.priority, category: r.category, title: r.title, description: r.description,
    impact: r.impact ?? null, remediation: r.remediation ?? null, timeframe: r.timeframe ?? null, service: r.service ?? null,
  }));
}

/* ----------------------- Configuration validation ---------------------- */

export function validateThresholds(th: Threshold[]): string[] {
  const e: string[] = [];
  if (!Array.isArray(th) || th.length < 2) return ['At least two maturity classifications are required.'];
  if (Number(th[0].min) !== 0) e.push('The first maturity classification must start at 0.');
  th.forEach((t, i) => {
    if (typeof t.min !== 'number' || t.min < 0 || t.min > 100) e.push('Classification thresholds must be numbers between 0 and 100.');
    if (i > 0 && !(t.min > th[i - 1].min)) e.push('Classification thresholds must be in strictly ascending order.');
    if (!t.key || !t.label?.en) e.push('Each classification needs a key and an English label.');
  });
  return [...new Set(e)];
}

/** Validates a snapshot before publishing. Empty list = valid. */
export function validateSnapshot(s: Snapshot): string[] {
  const e = validateThresholds(s.template?.thresholds ?? []);
  const catKeys = new Set((s.categories ?? []).map((c) => c.key));
  const seen = new Set<string>();
  let scored = 0;
  (s.questions ?? []).forEach((q, i) => {
    const code = q.code || `#${i}`;
    if (seen.has(code)) e.push(`Duplicate question code: ${code}`);
    if (!TYPES.includes(q.type)) e.push(`${code}: unknown question type`);
    if (!catKeys.has(q.category)) e.push(`${code}: category '${q.category}' does not exist`);
    if (!q.title?.en) e.push(`${code}: English title is required`);
    const w = q.weight ?? 1;
    if (typeof w !== 'number' || w <= 0 || w > 10) e.push(`${code}: weight must be between 0 and 10`);
    for (const o of options(q)) if (o.score !== undefined && o.score !== null && (typeof o.score !== 'number' || o.score < 0 || o.score > MAX)) e.push(`${code}: option scores must be between 0 and 4`);
    if ((q.type === 'single' || q.type === 'multi') && (q.options?.length ?? 0) < 2) e.push(`${code}: needs at least two options`);
    if (q.type === 'number' && isScored(q) && !q.ranges?.length) e.push(`${code}: scored numeric questions need score ranges`);
    for (const r of q.condition?.rules ?? []) if (!seen.has(r.q)) e.push(`${code}: condition must refer to an earlier question (got '${r.q}')`);
    if (q.risk && !RISKS.includes(q.risk)) e.push(`${code}: invalid risk classification`);
    seen.add(code);
    if (isScored(q)) scored++;
  });
  if (scored === 0) e.push('The assessment has no scored questions.');
  for (const r of s.rules ?? []) if (!(r.priority in PRIORITY_ORDER)) e.push(`Rule ${r.code}: invalid priority`);
  return [...new Set(e)];
}

/** Estimated completion time from unconditional questions (~14 s each). */
export function estimateMinutes(s: Snapshot): number {
  return Math.max(2, Math.ceil((s.questions.filter((q) => !q.condition).length * 14) / 60));
}

export const L = (l: Loc) => (v: LStr | undefined) => (v ? (v[l] && v[l] !== '' ? v[l]! : v.en) : '');
