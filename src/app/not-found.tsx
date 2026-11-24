import Button from "@/components/Button";
import RichText from "@/components/RichText";
import { getUi } from "@/content/catalog";

export default async function NotFound() {
  const t = await getUi();
  return (
    <section className="on-dark surface-dark relative overflow-hidden min-h-[80vh] flex items-center">
      <div aria-hidden="true" className="absolute inset-0 bg-grid-dark [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="container-page relative pt-[var(--header-h)]">
        <p className="t-mono text-brand-300">{t.nfEyebrow}</p>
        <h1 className="t-h1 mt-4 max-w-2xl">{t.nfTitle}</h1>
        <p className="t-lead mt-5 text-ink-300 max-w-xl">{t.nfText}</p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3">
          <Button href="/" size="lg">{t.nfHome}</Button>
          <Button href="/services" size="lg" variant="inverse">{t.nfServices}</Button>
        </div>
        <RichText className="mt-8 text-sm text-ink-300" text={t.nfContact} />
      </div>
    </section>
  );
}
