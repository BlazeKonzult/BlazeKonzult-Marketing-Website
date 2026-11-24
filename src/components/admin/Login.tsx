/* eslint-disable @next/next/no-img-element,  @typescript-eslint/no-explicit-any -- API responses differ per sign-in step */
"use client";

import { useState } from "react";
import { Copy, Download, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { api, type User } from "./lib";
import { Btn, Field, inputCls } from "./ui";

type Stage =
  | { kind: "password" }
  | { kind: "setup"; challenge: string; email: string; secret?: string; qr?: string }
  | { kind: "verify"; challenge: string; email: string; recovery: boolean }
  | { kind: "codes"; codes: string[]; user: User; csrf: string };

/** Admin sign-in: password, then an authenticator code (set up on first sign-in), with backup codes and "trust this device". */
export default function Login({ onLogin }: { onLogin: (u: User, csrf: string) => void }) {
  const [stage, setStage] = useState<Stage>({ kind: "password" });
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [code, setCode] = useState(""); const [trust, setTrust] = useState(false);
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(null); try { await fn(); } catch (x) { const e = x as Error & { code?: string }; setErr(e.message); if (e.code === "challenge_expired" || e.code === "locked") { setStage({ kind: "password" }); setCode(""); } } finally { setBusy(false); } };

  async function submitPassword() {
    const r = await api<any>("POST", "/login", { email, password: pw });
    setPw("");
    if (r.user) return onLogin(r.user, r.csrf);
    if (r.mfa === "setup") {
      const s = await api<any>("POST", "/login/setup", { challenge: r.challenge });
      setStage({ kind: "setup", challenge: r.challenge, email: r.email, secret: s.secret, qr: s.qr_svg });
    } else setStage({ kind: "verify", challenge: r.challenge, email: r.email, recovery: false });
  }

  async function submitCode(challenge: string, recovery = false) {
    const r = await api<any>("POST", "/login/verify", { challenge, trust_device: trust, ...(recovery ? { recovery_code: code } : { code }) });
    setCode("");
    if (r.recovery_codes) { setStage({ kind: "codes", codes: r.recovery_codes, user: r.user, csrf: r.csrf }); return; }
    if (typeof r.recovery_remaining === "number" && r.recovery_remaining <= 3) { try { sessionStorage.setItem("bk-admin-flash", `You have ${r.recovery_remaining} backup codes left. Create new ones under My account → Two-factor.`); } catch { /* ignore */ } }
    onLogin(r.user, r.csrf);
  }

  const shell = (children: React.ReactNode, wide = false) => (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative hidden overflow-hidden bg-[#0b1424] p-12 text-[#c3cddb] lg:flex lg:flex-col">
        <div className="flex items-center gap-3"><img src="/icon.svg" alt="" width={40} height={40} className="h-10 w-10 rounded-xl" /><div><p className="text-lg font-semibold text-white">Blaze<span className="text-[#b39dfa]">Konzult</span></p><p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8696ad]">Command Centre</p></div></div>
        <div className="mt-auto max-w-md">
          <p className="text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-white">Leads, assessments and your website, in one secure place.</p>
          <ul className="mt-6 space-y-2.5 text-sm">{["Two-factor sign-in on every account", "Personal data and assessment answers encrypted at rest", "Every administrative action recorded in the audit log"].map((t) => <li key={t} className="flex items-center gap-2.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#6d3bea]/30 text-[#d9ceff]" aria-hidden="true">✓</span>{t}</li>)}</ul>
        </div>
        <svg className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 opacity-[0.12]" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="#b39dfa" strokeWidth="0.6">{Array.from({ length: 9 }).map((_, i) => <circle key={i} cx="100" cy="100" r={12 + i * 11} />)}</g></svg>
      </div>
      <div className="grid place-items-center bg-paper p-4 sm:p-8">
        <div className={`w-full ${wide ? "max-w-lg" : "max-w-sm"}`}>
          <div className="mb-6 flex items-center gap-2.5 lg:hidden"><img src="/icon.svg" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" /><span className="font-semibold text-heading">BlazeKonzult Command Centre</span></div>
          <div className="rounded-2xl border border-line bg-surface p-7 shadow-[var(--a-shadow-pop)] sm:p-8">
            <h1 className="text-xl font-semibold text-heading">Sign in</h1>
            {children}
            {err && <p className="form-error mt-4" role="alert">{err}</p>}
          </div>
          <p className="mt-4 text-center text-xs text-muted">Authorised BlazeKonzult staff only. Sign-ins are recorded.</p>
        </div>
      </div>
    </div>
  );
  const trustBox = (
    <label className="mt-4 flex items-start gap-2 text-sm text-body">
      <input type="checkbox" className="check mt-0.5" checked={trust} onChange={(e) => setTrust(e.target.checked)} />
      <span>Trust this browser for 30 days. Only tick this on your own computer.</span>
    </label>
  );
  const codeInput = (label: string, recovery = false) => (
    <Field label={label}>
      <input className={`${inputCls} text-center font-mono text-lg tracking-[0.3em]`} autoFocus required value={code}
        inputMode={recovery ? "text" : "numeric"} autoComplete="one-time-code" maxLength={recovery ? 12 : 7} pattern={recovery ? undefined : "[0-9 ]{6,7}"}
        placeholder={recovery ? "xxxx-xxxx" : "123456"} onChange={(e) => setCode(recovery ? e.target.value : e.target.value.replace(/[^0-9]/g, ""))} />
    </Field>
  );

  if (stage.kind === "password") return shell(
    <form onSubmit={(e) => { e.preventDefault(); run(submitPassword); }}>
      <p className="mt-1 text-sm text-muted">Sign in to manage the website, assessments and leads.</p>
      <div className="mt-6 space-y-4">
        <Field label="Email"><input className={inputCls} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className={inputCls} type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      </div>
      <div className="mt-6"><Btn type="submit" kind="primary" disabled={busy}>{busy ? "Signing in…" : "Continue"}</Btn></div>
    </form>,
  );

  if (stage.kind === "setup") return shell(
    <form onSubmit={(e) => { e.preventDefault(); run(() => submitCode(stage.challenge)); }}>
      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-heading"><ShieldCheck size={16} className="text-ok" aria-hidden="true" /> Set up two-factor sign-in</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-body">
        <li>Open an authenticator app on your phone (Google Authenticator, Microsoft Authenticator, 1Password or similar).</li>
        <li>Scan this QR code, or enter the key below by hand.</li>
        <li>Type the 6-digit code the app shows.</li>
      </ol>
      {stage.qr && <div className="mx-auto mt-5 w-48 rounded-md border border-line p-2" role="img" aria-label={`QR code for ${stage.email}`} dangerouslySetInnerHTML={{ __html: stage.qr }} />}
      <p className="mt-3 text-center text-xs text-muted">Key: <code className="select-all break-all font-mono text-heading">{stage.secret}</code></p>
      <div className="mt-5">{codeInput("6-digit code from the app")}</div>
      {trustBox}
      <div className="mt-6 flex gap-2"><Btn type="submit" kind="primary" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Confirm and sign in"}</Btn><Btn onClick={() => setStage({ kind: "password" })}>Cancel</Btn></div>
    </form>, true,
  );

  if (stage.kind === "verify") return shell(
    <form onSubmit={(e) => { e.preventDefault(); run(() => submitCode(stage.challenge, stage.recovery)); }}>
      <p className="mt-1 flex items-center gap-2 text-sm text-muted">{stage.recovery ? <KeyRound size={16} aria-hidden="true" /> : <Smartphone size={16} aria-hidden="true" />} {stage.recovery ? "Enter one of your backup codes." : `Enter the code from your authenticator app for ${stage.email}.`}</p>
      <div className="mt-5">{codeInput(stage.recovery ? "Backup code" : "6-digit code", stage.recovery)}</div>
      {trustBox}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Btn type="submit" kind="primary" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Sign in"}</Btn>
        <Btn kind="ghost" onClick={() => { setCode(""); setStage({ ...stage, recovery: !stage.recovery }); }}>{stage.recovery ? "Use the authenticator app" : "Use a backup code"}</Btn>
      </div>
      <p className="mt-4 text-xs text-muted">Lost your phone and your backup codes? Ask the account owner to reset your two-factor sign-in.</p>
    </form>,
  );

  const text = `BlazeKonzult admin backup codes (${new Date().toISOString().slice(0, 10)})\nEach code works once.\n\n${stage.codes.join("\n")}\n`;
  return shell(
    <div>
      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-heading"><KeyRound size={16} aria-hidden="true" /> Save your backup codes</p>
      <p className="mt-2 text-sm text-body">If you lose your phone, each of these codes lets you sign in once. They are shown only now. Store them in a password manager or print them.</p>
      <ul className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-paper p-4 font-mono text-sm text-heading">{stage.codes.map((c) => <li key={c}>{c}</li>)}</ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn small onClick={() => navigator.clipboard?.writeText(text)}><Copy size={13} /> Copy</Btn>
        <Btn small onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = "blazekonzult-backup-codes.txt"; a.click(); }}><Download size={13} /> Download</Btn>
      </div>
      <label className="mt-5 flex items-start gap-2 text-sm text-body"><input type="checkbox" className="check mt-0.5" checked={saved} onChange={(e) => setSaved(e.target.checked)} /> I have saved my backup codes</label>
      <div className="mt-5"><Btn kind="primary" disabled={!saved} onClick={() => onLogin(stage.user, stage.csrf)}>Continue to the admin</Btn></div>
    </div>, true,
  );
}
