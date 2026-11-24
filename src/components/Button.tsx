import Link from "@/components/LocalLink";
import { ArrowRight } from "lucide-react";
import { type ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  /** primary: brand purple · secondary: outline on light · inverse: outline on dark · light: white fill on dark */
  variant?: "primary" | "secondary" | "inverse" | "light";
  size?: "md" | "lg";
  arrow?: boolean;
  className?: string;
};

const base =
  "group inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-semibold text-center sm:whitespace-nowrap " +
  "transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-[var(--ease-out-soft)] " +
  "active:translate-y-px";

const sizes = {
  md: "min-h-11 py-2 px-5 text-[0.9375rem]",
  lg: "min-h-12 py-2.5 px-6 text-base",
};

const variants = {
  primary: "bg-brand text-white hover:bg-brand-600 shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_8px_20px_-10px_rgb(109_59_234/0.8)]",
  secondary: "border border-heading/20 text-heading hover:border-heading/50 hover:bg-white",
  inverse: "border border-white/25 text-white hover:border-white/60 hover:bg-white/5",
  light: "bg-white text-ink-950 hover:bg-paper",
};

export default function Button({ href, children, variant = "primary", size = "md", arrow = false, className = "" }: ButtonProps) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
      )}
    </>
  );
  if (href.startsWith("http")) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}
