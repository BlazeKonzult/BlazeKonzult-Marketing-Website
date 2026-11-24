import Link from "@/components/LocalLink";

type LogoProps = {
  className?: string;
  /** "light" = for dark backgrounds (white wordmark), "dark" = for light backgrounds */
  tone?: "light" | "dark";
};

/**
 * BlazeKonzult wordmark. The purple "K" badge is the existing brand mark and is
 * kept unchanged so recognition carries over; the wordmark adapts to the surface.
 */
export default function Logo({ className = "", tone = "light" }: LogoProps) {
  const primary = tone === "light" ? "#FFFFFF" : "#0B1726";
  const secondary = tone === "light" ? "#B39DFA" : "#6D3BEA";

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="BlazeKonzult, home">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="bk-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6D3BEA" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#bk-mark)" />
        <path d="M11 8V24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M13.6 16L20 8" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M13.6 16L20 24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="13.6" cy="16" r="2" fill="white" />
      </svg>
      <span className="font-[family-name:var(--font-display)] font-bold text-[1.1875rem] tracking-[-0.02em] leading-none" style={{ color: primary }}>
        Blaze<span style={{ color: secondary }}>Konzult</span>
      </span>
    </Link>
  );
}
