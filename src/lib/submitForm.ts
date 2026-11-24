// Website forms feed the same lead pipeline as the assessment (Node API at /api/forms).
import { API_BASE } from "@/lib/assessment/api";
import { UI, type Ui } from "@/content/ui";

export type FormType = "contact" | "checklist" | "newsletter";

export async function submitForm(
  form: HTMLFormElement,
  formType: FormType,
  extra: Record<string, string> = {},
  t: Ui = UI.en,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body: Record<string, unknown> = { formType, ...extra };
  new FormData(form).forEach((v, k) => { body[k] = v === "on" ? true : String(v); });
  try {
    const res = await fetch(`${API_BASE}/forms`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.ok) return { ok: true };
    if (res.status === 429) return { ok: false, error: t.errTooMany };
    return { ok: false, error: extra.locale === "nl" ? t.errGeneric : json?.error?.message ?? t.errGeneric };
  } catch {
    return { ok: false, error: t.errNetwork };
  }
}
