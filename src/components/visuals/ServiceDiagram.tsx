import type { ServiceVisual } from "@/lib/serviceContent";

/**
 * One explanatory diagram per service, shown in the service hero.
 * Each depicts how the service works, not decorative "cyber" imagery.
 */
const mono = "font-[family-name:var(--font-mono)]";
const sans = "font-[family-name:var(--font-sans)]";

function Frame({ label, children, caption }: { label: string; children: React.ReactNode; caption: string }) {
  return (
    <figure className="rounded-[var(--radius-md)] border border-ink-700 bg-ink-900/80 backdrop-blur shadow-[var(--shadow-overlay)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink-700">
        <span className="t-eyebrow text-ink-300">{label}</span>
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-ink-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
        </span>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
      <figcaption className="px-5 py-3 border-t border-ink-700 text-xs text-ink-300">{caption}</figcaption>
    </figure>
  );
}

export default function ServiceDiagram({ visual }: { visual: ServiceVisual }) {
  switch (visual) {
    case "maturity": {
      const d = ["GOV", "IAM", "DEV", "DATA", "PPL", "IR", "SUP"];
      const v = [0.55, 0.8, 0.62, 0.35, 0.5, 0.28, 0.45];
      return (
        <Frame label="Baseline maturity" caption="Illustrative: findings are mapped across seven domains against a target level.">
          <svg viewBox="0 0 360 200" className="w-full" role="img" aria-label="Bar chart of seven security domains compared with a target line">
            <line x1="20" y1="58" x2="350" y2="58" stroke="#00B8D9" strokeDasharray="4 5" />
            <text x="350" y="50" textAnchor="end" fontSize="10" fill="#00B8D9" className={mono}>TARGET</text>
            {d.map((lab, i) => (
              <g key={lab}>
                <rect x={28 + i * 46} y={170 - v[i] * 140} width="26" height={v[i] * 140} rx="2" fill={v[i] < 0.4 ? "#6D3BEA" : "#2B4562"} />
                <text x={41 + i * 46} y="188" textAnchor="middle" fontSize="9.5" fill="#9FB0C4" className={mono}>{lab}</text>
              </g>
            ))}
          </svg>
        </Frame>
      );
    }
    case "regulation": {
      const steps = [
        { x: 40, t: "Aware", s: "T+0" },
        { x: 140, t: "Early warning", s: "≤ 24 h" },
        { x: 240, t: "Notification", s: "≤ 72 h" },
        { x: 330, t: "Final report", s: "≤ 1 month" },
      ];
      return (
        <Frame label="Cbw incident reporting" caption="Significant incidents under the Cyberbeveiligingswet, in force since 15 August 2026.">
          <svg viewBox="0 0 370 170" className="w-full" role="img" aria-label="Timeline: early warning within 24 hours, notification within 72 hours, final report within one month">
            <line x1="40" y1="70" x2="330" y2="70" stroke="#2B4562" strokeWidth="2" />
            <line x1="40" y1="70" x2="240" y2="70" stroke="#B39DFA" strokeWidth="2" />
            {steps.map((st, i) => (
              <g key={st.t}>
                <circle cx={st.x} cy="70" r={i === 0 ? 7 : 9} fill={i === 0 ? "#6D3BEA" : "#081421"} stroke={i === 0 ? "none" : i < 3 ? "#B39DFA" : "#2B4562"} strokeWidth="2" />
                <text x={st.x} y="40" textAnchor="middle" fontSize="11" fill="#fff" className={mono}>{st.s}</text>
                <text x={st.x} y="102" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#C9D4E1" className={sans}>{st.t}</text>
              </g>
            ))}
            <rect x="10" y="128" width="350" height="28" rx="4" fill="none" stroke="#1C3249" />
            <text x="185" y="146" textAnchor="middle" fontSize="9.5" fill="#9FB0C4" className={mono}>REGISTER WITH NCSC · DUTY OF CARE · BOARD ACCOUNTABLE</text>
          </svg>
        </Frame>
      );
    }
    case "governance": {
      const months = Array.from({ length: 12 }, (_, i) => i);
      return (
        <Frame label="Governance cadence" caption="Monthly advisory, quarterly reporting to leadership, one roadmap.">
          <svg viewBox="0 0 360 220" className="w-full" role="img" aria-label="Annual cycle of twelve monthly sessions with four quarterly reviews around a central risk register">
            {months.map((m) => {
              const a = ((m * 30 - 90) * Math.PI) / 180;
              const q = m % 3 === 2;
              return (
                <g key={m}>
                  <line x1={180 + 70 * Math.cos(a)} y1={110 + 70 * Math.sin(a)} x2={180 + 88 * Math.cos(a)} y2={110 + 88 * Math.sin(a)} stroke={q ? "#B39DFA" : "#2B4562"} strokeWidth={q ? 3 : 2} />
                  {q && (
                    <text x={180 + 104 * Math.cos(a)} y={114 + 104 * Math.sin(a)} textAnchor="middle" fontSize="10" fill="#B39DFA" className={mono}>{`Q${(m + 1) / 3}`}</text>
                  )}
                </g>
              );
            })}
            <circle cx="180" cy="110" r="52" fill="#132538" stroke="#2B4562" />
            <text x="180" y="106" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff" className={sans}>Risk register</text>
            <text x="180" y="122" textAnchor="middle" fontSize="9.5" fill="#9FB0C4" className={mono}>+ ROADMAP</text>
          </svg>
        </Frame>
      );
    }
    case "cycle": {
      const nodes = [
        { x: 180, y: 34, t: "Review" },
        { x: 316, y: 110, t: "Track" },
        { x: 180, y: 186, t: "Remediate" },
        { x: 44, y: 110, t: "Report" },
      ];
      return (
        <Frame label="Monthly improvement loop" caption="Each month: review posture, track actions, close vulnerabilities, report progress.">
          <svg viewBox="0 0 360 220" className="w-full" role="img" aria-label="Continuous loop: review, track, remediate, report">
            <ellipse cx="180" cy="110" rx="136" ry="76" fill="none" stroke="#2B4562" strokeWidth="2" />
            <ellipse cx="180" cy="110" rx="136" ry="76" fill="none" stroke="#B39DFA" strokeWidth="2" strokeDasharray="60 370" className="animate-dash" />
            {nodes.map((n) => (
              <g key={n.t}>
                <rect x={n.x - 42} y={n.y - 14} width="84" height="28" rx="14" fill="#081421" stroke="#3A5878" />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#E6ECF3" className={sans}>{n.t}</text>
              </g>
            ))}
            <text x="180" y="114" textAnchor="middle" fontSize="10" fill="#9FB0C4" className={mono}>EVERY MONTH</text>
          </svg>
        </Frame>
      );
    }
    case "awareness": {
      const steps = ["Message arrives", "Recognised", "Reported", "Contained"];
      return (
        <Frame label="From inbox to containment" caption="The goal is fast reporting: one early report protects everyone.">
          <svg viewBox="0 0 360 210" className="w-full" role="img" aria-label="Flow: suspicious message arrives, is recognised, reported and contained">
            {steps.map((s, i) => (
              <g key={s}>
                <rect x={20 + i * 14} y={20 + i * 46} width={320 - i * 28} height="34" rx="4" fill={i === 2 ? "rgb(109 59 234 / 0.35)" : "#132538"} stroke={i === 2 ? "#B39DFA" : "#2B4562"} />
                <text x="34" y={42 + i * 46} fontSize="12" fontWeight="600" fill="#E6ECF3" className={sans} dx={i * 14}>{s}</text>
                <text x={326 - i * 14} y={42 + i * 46} textAnchor="end" fontSize="10" fill={i === 2 ? "#B39DFA" : "#9FB0C4"} className={mono}>{["T+0", "SECONDS", "MINUTES", "< 1 HOUR"][i]}</text>
              </g>
            ))}
          </svg>
        </Frame>
      );
    }
    case "response": {
      const ph = ["Detect", "Contain", "Recover", "Learn"];
      return (
        <Frame label="Response phases" caption="A rehearsed plan sets who decides, who to call and what to restore first.">
          <svg viewBox="0 0 360 190" className="w-full" role="img" aria-label="Incident phases: detect, contain, recover, learn, with decision owner and escalation contacts">
            {ph.map((p, i) => (
              <g key={p}>
                <polygon points={`${14 + i * 84},40 ${86 + i * 84},40 ${100 + i * 84},70 ${86 + i * 84},100 ${14 + i * 84},100 ${28 + i * 84},70`} fill={i === 1 ? "#6D3BEA" : "#132538"} stroke={i === 1 ? "none" : "#2B4562"} />
                <text x={57 + i * 84} y="74" textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff" className={sans}>{p}</text>
              </g>
            ))}
            <line x1="14" y1="130" x2="346" y2="130" stroke="#1C3249" />
            <text x="14" y="152" fontSize="10" fill="#9FB0C4" className={mono}>DECISION OWNER</text>
            <text x="14" y="170" fontSize="11.5" fill="#E6ECF3" className={sans}>Named in advance</text>
            <text x="346" y="152" textAnchor="end" fontSize="10" fill="#9FB0C4" className={mono}>ESCALATION</text>
            <text x="346" y="170" textAnchor="end" fontSize="11.5" fill="#E6ECF3" className={sans}>One-page checklist</text>
          </svg>
        </Frame>
      );
    }
    case "assurance": {
      const s = ["Questionnaire", "Evidence", "Gaps", "Roadmap"];
      return (
        <Frame label="Assurance workflow" caption="Answers backed by evidence, gaps backed by a plan, and a library you can reuse.">
          <svg viewBox="0 0 360 200" className="w-full" role="img" aria-label="Workflow: questionnaire, evidence, gaps, roadmap">
            {s.map((t, i) => (
              <g key={t} transform={`translate(${12 + i * 88} 30)`}>
                <rect width="72" height="92" rx="4" fill={i === 1 ? "rgb(109 59 234 / 0.3)" : "#132538"} stroke={i === 1 ? "#B39DFA" : "#2B4562"} />
                {[0, 1, 2, 3].map((l) => (
                  <line key={l} x1="12" y1={22 + l * 15} x2={l === 3 ? 40 : 60} y2={22 + l * 15} stroke={i === 2 && l === 1 ? "#D14343" : "#3A5878"} strokeWidth="3" strokeLinecap="round" />
                ))}
                <text x="36" y="118" textAnchor="middle" fontSize="11" fontWeight="600" fill="#E6ECF3" className={sans}>{t}</text>
                {i < 3 && <path d="M76 46 l10 0" stroke="#00B8D9" strokeWidth="2" markerEnd="url(#arr)" />}
              </g>
            ))}
            <defs>
              <marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill="#00B8D9" />
              </marker>
            </defs>
            <text x="180" y="186" textAnchor="middle" fontSize="10" fill="#9FB0C4" className={mono}>REUSABLE ANSWER LIBRARY</text>
          </svg>
        </Frame>
      );
    }
  }
}
