/**
 * Typographic article cover generated from the category, so every insight has a
 * consistent, original visual without stock photography.
 */
const patterns: Record<string, "rings" | "grid" | "bars" | "nodes" | "wave"> = {
  "NIS2 & Regulation": "grid",
  Assessment: "bars",
  "Supplier Assurance": "nodes",
  "Practical Guidance": "grid",
  "Incident Readiness": "rings",
  Governance: "bars",
  "Awareness Training": "wave",
  "Sector Insights": "nodes",
};

export default function ArticleCover({ category, size = "md", className = "" }: { category: string; size?: "md" | "lg"; className?: string }) {
  const p = patterns[category] ?? "grid";
  return (
    <div className={`relative overflow-hidden bg-ink-950 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {p === "grid" &&
          Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <line x1={i * 40} y1="0" x2={i * 40} y2="240" stroke="#1C3249" />
              <line x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="#1C3249" />
            </g>
          ))}
        {p === "grid" && <rect x="240" y="80" width="80" height="80" fill="none" stroke="#B39DFA" strokeWidth="1.5" />}
        {p === "grid" && <rect x="280" y="120" width="40" height="40" fill="#6D3BEA" />}
        {p === "rings" && [40, 80, 120, 160, 200].map((r) => <circle key={r} cx="310" cy="120" r={r} fill="none" stroke={r === 80 ? "#00B8D9" : "#2B4562"} />)}
        {p === "rings" && <circle cx="310" cy="120" r="8" fill="#6D3BEA" />}
        {p === "bars" && [0.35, 0.55, 0.42, 0.75, 0.6, 0.88].map((h, i) => (
          <rect key={i} x={200 + i * 30} y={200 - h * 150} width="18" height={h * 150} fill={i === 3 ? "#6D3BEA" : "#1C3249"} />
        ))}
        {p === "nodes" && (
          <g>
            {[[230, 70], [330, 60], [280, 140], [360, 170], [210, 180]].map(([x, y], i, a) => (
              <g key={i}>
                {a.slice(i + 1).map(([x2, y2], j) => <line key={j} x1={x} y1={y} x2={x2} y2={y2} stroke="#2B4562" />)}
              </g>
            ))}
            {[[230, 70], [330, 60], [280, 140], [360, 170], [210, 180]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i === 2 ? 9 : 5} fill={i === 2 ? "#6D3BEA" : "#081421"} stroke={i === 2 ? "none" : "#B39DFA"} />
            ))}
          </g>
        )}
        {p === "wave" && [0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M150 ${80 + i * 22} C 220 ${40 + i * 22}, 300 ${130 + i * 22}, 420 ${70 + i * 22}`} fill="none" stroke={i === 2 ? "#00B8D9" : "#2B4562"} strokeWidth="1.5" />
        ))}
      </svg>
      <span className={`absolute left-5 top-5 t-eyebrow text-brand-300 ${size === "lg" ? "sm:left-8 sm:top-8" : ""}`}>{category}</span>
    </div>
  );
}
