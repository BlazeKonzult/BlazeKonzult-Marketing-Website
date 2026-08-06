type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h2" | "h1";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as = "h2",
}: SectionHeadingProps) {
  const Heading = as;
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : "text-left"}`}>
      {eyebrow && (
        <p className="text-xs font-bold text-primary-purple uppercase tracking-widest mb-4">
          {eyebrow}
        </p>
      )}
      <Heading className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] text-deep-purple">
        {title}
      </Heading>
      {description && (
        <p className="mt-4 text-lg text-text-secondary leading-relaxed">{description}</p>
      )}
    </div>
  );
}
