import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import IconRenderer from "./IconRenderer";
import type { Service } from "@/lib/data";

type ServiceCardProps = {
  service: Service;
  showDeliverables?: boolean;
};

export default function ServiceCard({ service, showDeliverables = false }: ServiceCardProps) {
  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-light-lavender p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center mb-5">
        <IconRenderer name={service.icon} size={22} className="text-white" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-resilience-teal mb-2">
        {service.category}
      </span>
      <h3 className="text-lg font-bold text-deep-purple mb-2 leading-snug">{service.name}</h3>
      <p className="text-sm text-text-secondary leading-relaxed mb-4">
        {service.shortDescription}
      </p>
      {showDeliverables && (
        <ul className="mb-5 space-y-2 flex-1">
          {service.deliverables.slice(0, 3).map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm text-text-dark">
              <Check size={16} className="text-resilience-teal shrink-0 mt-0.5" aria-hidden="true" />
              {d}
            </li>
          ))}
        </ul>
      )}
      {!showDeliverables && <div className="flex-1" />}
      <Link
        href={service.href}
        className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-primary-purple hover:text-deep-purple"
      >
        Learn more
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </div>
  );
}
