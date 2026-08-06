import Link from "next/link";
import { type ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "teal";
  size?: "md" | "lg";
  className?: string;
  icon?: ReactNode;
};

export default function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  icon,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-wide transition-all duration-200 focus-visible:outline-none text-center";
  const sizes = {
    md: "px-6 py-3 text-xs min-h-11",
    lg: "px-8 py-4 text-sm min-h-12",
  };
  const variants = {
    primary:
      "bg-primary-purple text-white hover:bg-deep-purple shadow-sm hover:shadow-md",
    secondary:
      "bg-white text-deep-purple border-2 border-primary-purple hover:bg-light-lavender",
    ghost: "bg-transparent text-deep-purple hover:bg-light-lavender",
    teal: "bg-resilience-teal text-white hover:opacity-90 shadow-sm",
  };

  const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");

  const content = (
    <>
      {children}
      {icon}
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {content}
    </Link>
  );
}
