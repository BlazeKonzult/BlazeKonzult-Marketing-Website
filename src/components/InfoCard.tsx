import IconRenderer from "./IconRenderer";

type InfoCardProps = {
  icon: string;
  title: string;
  description: string;
  accent?: "purple" | "teal";
};

export default function InfoCard({ icon, title, description, accent = "purple" }: InfoCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-light-lavender p-6 shadow-sm h-full">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
          accent === "teal" ? "bg-resilience-teal-light" : "bg-light-lavender"
        }`}
      >
        <IconRenderer
          name={icon}
          size={20}
          className={accent === "teal" ? "text-resilience-teal" : "text-primary-purple"}
        />
      </div>
      <h3 className="font-bold text-deep-purple mb-1.5">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
