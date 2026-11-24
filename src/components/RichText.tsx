import Link from "@/components/LocalLink";
import { Fragment, type ReactNode } from "react";

const SAFE = /^(\/(?!\/)|#|https?:\/\/|mailto:)/i;

/** Renders admin-edited text safely: plain text with [link text](/path) and **bold** only. No HTML. */
export function inline(text: string, linkClass = "link"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]{1,300})\]\(([^)\s]{1,500})\)|\*\*([^*]{1,500})\*\*/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      const href = m[2];
      if (!SAFE.test(href)) out.push(m[1]);
      else if (href.startsWith("/") || href.startsWith("#")) out.push(<Link key={i++} href={href} className={linkClass}>{m[1]}</Link>);
      else out.push(<a key={i++} href={href} className={linkClass} target="_blank" rel="noopener noreferrer">{m[1]}</a>);
    } else out.push(<strong key={i++} className="font-semibold text-heading">{m[3]}</strong>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text, className, as: Tag = "p", linkClass }: { text: string; className?: string; as?: "p" | "span" | "li" | "dd"; linkClass?: string }) {
  if (!text) return null;
  return <Tag className={className}>{inline(text, linkClass).map((n, i) => <Fragment key={i}>{n}</Fragment>)}</Tag>;
}

/** Only allow safe link targets from edited content. */
export const safeHref = (h: string | undefined, fallback = "/") => (h && SAFE.test(h.trim()) ? h.trim() : fallback);
