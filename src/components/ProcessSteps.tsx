import IconRenderer from "./IconRenderer";
import { processSteps } from "@/lib/data";

export default function ProcessSteps() {
  return (
    <div className="relative">
      <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-light-lavender" aria-hidden="true" />
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {processSteps.map((step) => (
          <li key={step.step} className="relative flex flex-col items-center text-center">
            <div className="relative z-10 w-16 h-16 rounded-full gradient-purple flex items-center justify-center shadow-md mb-5">
              <IconRenderer name={step.icon} size={26} className="text-white" />
            </div>
            <span className="text-xs font-bold text-resilience-teal uppercase tracking-wide mb-1">
              Step {step.step}
            </span>
            <h3 className="text-lg font-bold text-deep-purple mb-1.5">{step.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
