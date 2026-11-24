/**
 * Original hero composition: the organisation's core assets protected by layered
 * control domains, connected to the external parties that create risk
 * (cloud services, partners, remote users). Purely illustrative, no data.
 */
const C = { x: 300, y: 270 };

function hex(r: number, rot = -90) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((rot + i * 60) * Math.PI) / 180;
    return [C.x + r * Math.cos(a), C.y + r * Math.sin(a)] as const;
  });
}
const pts = (p: readonly (readonly [number, number])[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const domains = ["Governance", "Identity", "Devices", "Data", "People", "Suppliers"];
const ring = hex(150);
const inner = hex(84);
const outer = hex(232, -60);
const external = [
  { i: 0, label: "Cloud services", to: 1 },
  { i: 2, label: "Partners", to: 5 },
  { i: 4, label: "Remote users", to: 3 },
];

const NL = {
  domains: ["Governance", "Identiteit", "Apparaten", "Data", "Mensen", "Leveranciers"],
  external: ["Clouddiensten", "Partners", "Externe gebruikers"],
  core: ["KERN-", "WAARDEN"],
  title: "Diagram: de kernwaarden van een organisatie, beschermd door lagen van beveiligingsdomeinen, verbonden met clouddiensten, partners en externe gebruikers.",
};

export default function HeroVisual({ className = "", locale = "en" }: { className?: string; locale?: "en" | "nl" }) {
  const nl = locale === "nl";
  return (
    <svg viewBox="0 0 600 540" className={className} role="img" aria-labelledby="hero-visual-title">
      <title id="hero-visual-title">
        {nl ? NL.title : "Diagram: an organisation's core assets protected by layered control domains, connected to cloud services, partners and remote users."}
      </title>
      <defs>
        <radialGradient id="hv-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#5A2BD4" />
        </radialGradient>
        <radialGradient id="hv-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#6D3BEA" stopOpacity="0.35" />
          <stop offset="1" stopColor="#6D3BEA" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={C.x} cy={C.y} r="210" fill="url(#hv-glow)" />

      {/* outer boundary */}
      <polygon points={pts(outer)} fill="none" stroke="#2B4562" strokeDasharray="2 8" />
      {/* control ring */}
      <polygon points={pts(ring)} fill="rgb(19 37 56 / 0.55)" stroke="#3A5878" />
      {/* inner ring */}
      <polygon points={pts(inner)} fill="none" stroke="#B39DFA" strokeOpacity="0.45" />

      {/* spokes */}
      {ring.map(([x, y], i) => (
        <line key={`s${i}`} x1={C.x} y1={C.y} x2={x} y2={y} stroke="#2B4562" />
      ))}
      {ring.map(([x, y], i) => {
        const [nx, ny] = ring[(i + 2) % 6];
        return <line key={`c${i}`} x1={x} y1={y} x2={nx} y2={ny} stroke="#1C3249" />;
      })}

      {/* external connections with moving traffic */}
      {external.map(({ i, to }) => {
        const [x1, y1] = outer[i];
        const [x2, y2] = ring[to];
        return (
          <g key={`e${i}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2B4562" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00B8D9" strokeOpacity="0.9" strokeWidth="1.5" strokeDasharray="3 21" className="animate-dash" />
          </g>
        );
      })}

      {/* external nodes */}
      {external.map(({ i, label: en }, n) => {
        const label = nl ? NL.external[n] : en;
        const [x, y] = outer[i];
        const right = x > C.x + 10;
        return (
          <g key={`n${i}`}>
            <rect x={x - 7} y={y - 7} width="14" height="14" rx="3" fill="#081421" stroke="#00B8D9" />
            <text
              x={right ? x + 14 : x}
              y={right ? y + 4 : y - 16}
              textAnchor={right ? "start" : "middle"}
              className="font-[family-name:var(--font-mono)]"
              fontSize="12"
              letterSpacing="1.2"
              fill="#9FB0C4"
            >
              {label.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* control domain nodes */}
      {ring.map(([x, y], i) => {
        const dx = x - C.x;
        const dy = y - C.y;
        const len = Math.hypot(dx, dy);
        const lx = x + (dx / len) * 22;
        const ly = y + (dy / len) * 22;
        const anchor = Math.abs(dx) < 10 ? "middle" : dx > 0 ? "start" : "end";
        const highlight = i === 1 || i === 3;
        return (
          <g key={`d${i}`}>
            <circle cx={x} cy={y} r="11" fill="#081421" stroke={highlight ? "#00B8D9" : "#B39DFA"} strokeWidth="1.5" />
            <circle cx={x} cy={y} r="3.5" fill={highlight ? "#00B8D9" : "#B39DFA"} className={highlight ? "animate-pulse-node" : undefined} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
            <text x={lx} y={ly + (Math.abs(dx) < 10 ? (dy < 0 ? -2 : 10) : 4)} textAnchor={anchor} fontSize="14" fontWeight="600" fill="#E6ECF3" className="font-[family-name:var(--font-sans)]">
              {nl ? NL.domains[i] : domains[i]}
            </text>
          </g>
        );
      })}

      {/* core */}
      <polygon points={pts(hex(44))} fill="url(#hv-core)" />
      <text x={C.x} y={C.y - 3} textAnchor="middle" fontSize="10" letterSpacing="1.6" fill="#fff" className="font-[family-name:var(--font-mono)]">{nl ? NL.core[0] : "CORE"}</text>
      <text x={C.x} y={C.y + 11} textAnchor="middle" fontSize="10" letterSpacing="1.6" fill="#fff" className="font-[family-name:var(--font-mono)]">{nl ? NL.core[1] : "ASSETS"}</text>
    </svg>
  );
}
