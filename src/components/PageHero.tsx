import { type ReactNode } from "react";
import DotGrid from "./DotGrid";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

export default function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden gradient-purple-soft border-b border-light-lavender">
      <DotGrid />
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-bright-violet/10 blur-3xl"
      />
      <div className="container-page relative py-16 sm:py-24">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-bold text-primary-purple uppercase tracking-widest mb-5">
              {eyebrow}
            </p>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-deep-purple leading-[1.05]">
            {title}
          </h1>
          {description && (
            <p className="mt-5 text-lg text-text-secondary leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
