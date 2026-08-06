type DotGridProps = {
  className?: string;
  variant?: "light" | "dark";
};

/**
 * Decorative dotted-grid texture, inspired by dense technical network
 * backgrounds — reworked in soft purple tones to stay consistent with
 * BlazeKonzult's calm, approachable brand (no dark/neon "hacker" styling).
 * Purely decorative: aria-hidden and ignored by assistive tech.
 */
export default function DotGrid({ className = "", variant = "light" }: DotGridProps) {
  const dotColor = variant === "dark" ? "#FFFFFF" : "#6D3BEA";
  const patternId = variant === "dark" ? "bk-dot-grid-dark" : "bk-dot-grid-light";

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={patternId} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill={dotColor} opacity={variant === "dark" ? 0.16 : 0.14} />
        </pattern>
        <radialGradient id={`${patternId}-fade`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`${patternId}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${patternId}-fade)`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} mask={`url(#${patternId}-mask)`} />
    </svg>
  );
}
