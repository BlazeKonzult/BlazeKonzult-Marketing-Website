type Stat = { value: string; suffix?: string; label: string };

const stats: Stat[] = [
  { value: "5", suffix: "+", label: "Professional cybersecurity certifications" },
  { value: "7", suffix: "+", label: "Dedicated service areas, assess to respond" },
  { value: "4", label: "Step engagement process, start to roadmap" },
  { value: "90", suffix: "-day", label: "Prioritised action plan from every Health Check" },
];

/**
 * Bold stat strip, structurally inspired by enterprise cybersecurity sites —
 * uses only defensible facts about BlazeKonzult's own service offering
 * (no invented client counts, revenue or performance claims).
 */
export default function StatsStrip() {
  return (
    <section className="gradient-purple py-16 sm:py-20" aria-label="BlazeKonzult at a glance">
      <div className="container-page grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              {stat.value}
              {stat.suffix && <span className="text-bright-violet">{stat.suffix}</span>}
            </p>
            <p className="mt-2 text-sm text-white/80 leading-snug max-w-[14rem] mx-auto">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
