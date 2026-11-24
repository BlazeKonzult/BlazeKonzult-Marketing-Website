import { type ReactNode } from "react";

type SectionIntroProps = {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  as?: "h1" | "h2";
  className?: string;
};

/** Eyebrow + heading + lead, the standard opening of every section. */
export default function SectionIntro({ eyebrow, title, lead, align = "left", tone = "light", as = "h2", className = "" }: SectionIntroProps) {
  const Heading = as;
  return (
    <div className={`${align === "center" ? "mx-auto text-center max-w-3xl" : "max-w-3xl"} ${className}`}>
      {eyebrow && (
        <p className={`t-eyebrow ${tone === "dark" ? "text-brand-300" : "text-brand"} flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}>
          <span aria-hidden="true" className={`h-px w-6 ${tone === "dark" ? "bg-brand-300/60" : "bg-brand/50"}`} />
          {eyebrow}
        </p>
      )}
      <Heading className={`${as === "h1" ? "t-h1" : "t-h2"} mt-4`}>{title}</Heading>
      {lead && <div className={`t-lead mt-5 ${tone === "dark" ? "text-ink-300" : "text-muted"}`}>{lead}</div>}
    </div>
  );
}
