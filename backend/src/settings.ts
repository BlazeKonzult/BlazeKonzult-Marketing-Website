import { db } from './db';
import { ApiError } from './http';

export type Threshold = { min: number; key: string; label: { en: string; nl?: string } };

/** Admin-editable settings with safe defaults. */
export const DEFAULTS = {
  notify_emails: ['Johnsonlawalgm@gmail.com'] as string[],
  notify_on_new_lead: true,
  notify_on_consultation: true,
  notify_high_priority_only: false,
  participant_emails: true,
  report_link_days: 14,
  result_link_days: 30,
  retention_days_anonymous: 365,
  retention_days_leads: 730,
  retention_days_sessions: 180,
  retention_days_audit: 730,
  track_steps: true,
  min_completion_seconds: 20,
  max_recommendations: 8,
  thresholds: [
    { min: 0, key: 'initial', label: { en: 'Initial', nl: 'Initieel' } },
    { min: 25, key: 'developing', label: { en: 'Developing', nl: 'In ontwikkeling' } },
    { min: 50, key: 'established', label: { en: 'Established', nl: 'Gevestigd' } },
    { min: 75, key: 'advanced', label: { en: 'Advanced', nl: 'Gevorderd' } },
    { min: 90, key: 'highly_mature', label: { en: 'Highly mature', nl: 'Zeer volwassen' } },
  ] as Threshold[],
  unsure_policy: 'zero' as 'zero' | 'exclude',
  strength_threshold: 75,
  lead_scoring: {
    consultation: 40,
    report_only: 10,
    company_size: { '1-9': 0, '10-49': 10, '50-249': 20, '250+': 25 } as Record<string, number>,
    timeframe: { immediate: 20, '30_days': 15, '3_months': 5, exploring: 0 } as Record<string, number>,
    per_interest: 5,
    max_interest: 15,
    high: 60,
    medium: 30,
  },
  company: {
    name: 'BlazeKonzult',
    website: 'https://blazekonzult.nl',
    contact_url: 'https://blazekonzult.nl/contact/',
    linkedin: 'https://www.linkedin.com/in/dazzy',
  },
};
export type SettingsShape = typeof DEFAULTS;
export type SettingKey = keyof SettingsShape;

let cache: Partial<SettingsShape> = {};
let cacheAt = 0;

export const Settings = {
  async get<K extends SettingKey>(k: K): Promise<SettingsShape[K]> {
    if (Date.now() - cacheAt > 30_000) { cache = {}; cacheAt = Date.now(); }
    if (k in cache) return cache[k] as SettingsShape[K];
    const r = await db.one<{ value: string }>('SELECT `value` FROM settings WHERE `key` = ?', [k]);
    const v = r ? JSON.parse(r.value) : DEFAULTS[k];
    (cache as any)[k] = v;
    return v;
  },
  async set<K extends SettingKey>(k: K, v: SettingsShape[K]): Promise<void> {
    if (!(k in DEFAULTS)) throw new ApiError(`Unknown setting: ${String(k)}`, 'validation', 422);
    await db.run('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)', [k, JSON.stringify(v)]);
    (cache as any)[k] = v;
  },
  async all(): Promise<SettingsShape> {
    const out: any = {};
    for (const k of Object.keys(DEFAULTS) as SettingKey[]) out[k] = await Settings.get(k);
    return out;
  },
  clearCache(): void { cache = {}; },
};
