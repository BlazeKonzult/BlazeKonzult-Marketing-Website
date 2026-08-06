import { Quote } from "lucide-react";

export default function TestimonialCard({ label, quote }: { label: string; quote: string }) {
  return (
    <div className="relative bg-white rounded-2xl border border-light-lavender p-7 shadow-sm h-full flex flex-col">
      <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wide text-white bg-text-secondary/70 rounded-full px-2.5 py-1">
        Placeholder
      </span>
      <Quote size={24} className="text-bright-violet mb-4" aria-hidden="true" />
      <p className="text-text-secondary leading-relaxed italic flex-1">&ldquo;{quote}&rdquo;</p>
      <p className="mt-5 text-sm font-semibold text-deep-purple">{label}</p>
    </div>
  );
}
