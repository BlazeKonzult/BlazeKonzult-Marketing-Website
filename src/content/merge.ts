const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
/** Saved values win; objects merge recursively so fields added in code later get their default. Arrays are replaced. */
export function mergeDefaults<T>(def: T, saved: unknown): T {
  if (saved === undefined || saved === null) return def;
  if (isObj(def) && isObj(saved)) {
    const out: Record<string, unknown> = { ...def };
    for (const [k, v] of Object.entries(saved)) out[k] = k in def ? mergeDefaults((def as Record<string, unknown>)[k], v) : v;
    return out as T;
  }
  if (Array.isArray(def) && !Array.isArray(saved)) return def;
  if (typeof def === "string" && typeof saved !== "string") return def;
  return saved as T;
}

