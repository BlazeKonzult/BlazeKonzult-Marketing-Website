"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

export type FAQItem = { question: string; answer: string };

export default function FAQAccordion({ items, defaultOpen = 0 }: { items: FAQItem[]; defaultOpen?: number | null }) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);
  const uid = useId();

  return (
    <div className="border-t border-line">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `${uid}-panel-${i}`;
        const buttonId = `${uid}-button-${i}`;
        return (
          <div key={item.question} className="border-b border-line">
            <h3 className="font-[family-name:var(--font-sans)] tracking-normal">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="group w-full flex items-start justify-between gap-6 py-5 text-left"
              >
                <span className={`text-[1.0625rem] font-semibold transition-colors ${isOpen ? "text-brand" : "text-heading group-hover:text-brand"}`}>
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid place-items-center w-7 h-7 shrink-0 rounded-full border transition-[transform,border-color,background-color] duration-300 ${
                    isOpen ? "rotate-45 border-brand bg-brand text-white" : "border-line text-heading group-hover:border-brand"
                  }`}
                >
                  <Plus size={15} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out-soft)] ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-6 pr-12 text-body leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
