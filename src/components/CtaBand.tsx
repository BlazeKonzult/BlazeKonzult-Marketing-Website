import { type ReactNode } from "react";
import Button from "@/components/Button";

type CtaBandProps = {
  title: ReactNode;
  body?: ReactNode;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
};

/** Closing conversion band used at the end of pages. */
export default function CtaBand({
  title,
  body,
  primary = { label: "Book a Consultation", href: "/contact" },
  secondary = { label: "Take the readiness assessment", href: "/cybersecurity-assessment/" },
}: CtaBandProps) {
  return (
    <section className="on-dark surface-dark relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-grid-dark [mask-image:radial-gradient(ellipse_at_70%_50%,black,transparent_70%)]" />
      <svg aria-hidden="true" className="absolute right-0 top-1/2 -translate-y-1/2 h-[140%] opacity-[0.35] hidden md:block" viewBox="0 0 400 400" fill="none">
        {[60, 110, 160, 210].map((r) => (
          <circle key={r} cx="320" cy="200" r={r} stroke="var(--color-brand-300)" strokeOpacity={0.5 - r / 600} strokeDasharray={r % 100 === 10 ? "3 7" : undefined} />
        ))}
        <circle cx="320" cy="200" r="6" fill="var(--color-brand)" />
      </svg>
      <div className="container-page relative section grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.4fr)_auto] lg:items-end">
        <div className="max-w-2xl">
          <h2 className="t-h1">{title}</h2>
          {body && <p className="t-lead mt-5 text-ink-300">{body}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button href={primary.href} size="lg" arrow>{primary.label}</Button>
          <Button href={secondary.href} size="lg" variant="inverse">{secondary.label}</Button>
        </div>
      </div>
    </section>
  );
}
