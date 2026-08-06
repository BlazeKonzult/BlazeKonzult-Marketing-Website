import { credibilityItems } from "@/lib/data";

export default function CredibilityStrip() {
  return (
    <section
      aria-label="Founder credentials and areas of expertise"
      className="border-y border-light-lavender bg-white"
    >
      <div className="container-page py-8">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {credibilityItems.map((item) => (
            <li
              key={item}
              className="text-sm font-semibold text-text-secondary tracking-wide uppercase"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
