import Link from "next/link";

type LogoProps = {
  className?: string;
  variant?: "dark" | "light";
};

/**
 * BlazeKonzult wordmark.
 * Concept: confident, geometric sans wordmark with a custom "K" — the first
 * stroke of the K is broken into two angled segments joined by a small
 * gradient node, suggesting a secure connection point / forward motion.
 * Reads cleanly at small sizes (favicon, mobile header) because the mark
 * is built from straight lines only, no fine detail.
 */
export default function Logo({ className = "", variant = "dark" }: LogoProps) {
  const textColor = variant === "dark" ? "#32156F" : "#FFFFFF";
  const secondaryColor = variant === "dark" ? "#15131D" : "#F2EEFF";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 group ${className}`}
      aria-label="BlazeKonzult home"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="bk-node-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6D3BEA" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#bk-node-gradient)" />
        {/* Stylised K: vertical stroke + two angled arms meeting a node */}
        <path d="M11 8V24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M13.6 16L20 8" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M13.6 16L20 24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="13.6" cy="16" r="2" fill="white" />
      </svg>
      <span
        className="font-heading font-bold text-xl tracking-tight leading-none"
        style={{ color: textColor }}
      >
        Blaze<span style={{ color: secondaryColor }}>Konzult</span>
      </span>
    </Link>
  );
}
