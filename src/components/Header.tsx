"use client";

import Link from "@/components/LocalLink";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import IconRenderer from "@/components/IconRenderer";
import { useSite } from "@/components/SiteData";
import LanguageToggle from "@/components/LanguageToggle";
import { basePath } from "@/lib/locale";

type MenuId = "services" | "industries" | null;

export default function Header() {
  const { industries, serviceBySlug, serviceGroups, nav, site, t } = useSite();
  const norm = (h: string) => basePath(h).replace(/\/$/, "") || "/";
  const label = (href: string, fallback: string) => nav.find((n) => norm(n.href) === href)?.label ?? fallback;
  const plainNav = nav.filter((n) => !["/services", "/industries"].includes(norm(n.href)));
  const cta = { label: site.header.ctaLabel, href: site.header.ctaHref };
  const fullPath = usePathname() ?? "/";
  const pathname = basePath(fullPath);
  const [compact, setCompact] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MenuId>(null);
  const headerRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset UI state when the route changes
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Escape + outside click
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const hoverOpen = useCallback((id: MenuId) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenMenu(id), 80);
  }, []);
  const hoverClose = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenMenu(null), 180);
  }, []);

  const isActive = (href: string) => { const h = norm(href); return h === "/" ? pathname === "/" : pathname.startsWith(h); };
  const serviceActive = serviceGroups.some((g) => g.slugs.some((s) => pathname.startsWith(`/${s}`))) || pathname.startsWith("/services");

  const navItem =
    "relative inline-flex items-center gap-1 h-10 px-3 text-[0.9375rem] font-medium text-ink-200 hover:text-white transition-colors";
  const activeBar = "after:absolute after:left-3 after:right-3 after:-bottom-px after:h-0.5 after:bg-brand-300";

  return (
    <header
      ref={headerRef}
      className={`on-dark fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,height] duration-300 ${
        compact || openMenu
          ? "bg-ink-950/95 backdrop-blur-md shadow-[0_1px_0_var(--color-ink-700)]"
          : "bg-transparent"
      }`}
    >
      <a href="#main-content" className="sr-only-focusable absolute left-4 top-3 z-50 bg-white text-ink-950 px-4 py-2 rounded-[var(--radius-sm)]">
        {t.skip}
      </a>
      <div
        className={`container-page flex items-center justify-between gap-6 transition-[height] duration-300 ${
          compact ? "h-[var(--header-h-compact)]" : "h-[var(--header-h)]"
        }`}
      >
        <Logo tone="light" />

        <nav aria-label={t.mainNav} className="hidden lg:flex items-center gap-1">
          <div onMouseEnter={() => hoverOpen("services")} onMouseLeave={hoverClose}>
            <button
              type="button"
              className={`${navItem} ${serviceActive ? `text-white ${activeBar}` : ""}`}
              aria-expanded={openMenu === "services"}
              aria-controls="menu-services"
              onClick={() => setOpenMenu(openMenu === "services" ? null : "services")}
            >
              {label("/services", t.services)}
              <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${openMenu === "services" ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div onMouseEnter={() => hoverOpen("industries")} onMouseLeave={hoverClose}>
            <button
              type="button"
              className={`${navItem} ${isActive("/industries") ? `text-white ${activeBar}` : ""}`}
              aria-expanded={openMenu === "industries"}
              aria-controls="menu-industries"
              onClick={() => setOpenMenu(openMenu === "industries" ? null : "industries")}
            >
              {label("/industries", t.industries)}
              <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${openMenu === "industries" ? "rotate-180" : ""}`} />
            </button>
          </div>
          {plainNav.map((l) => (
            <Link key={l.href} href={l.href} className={`${navItem} ${isActive(l.href) ? `text-white ${activeBar}` : ""}`} aria-current={isActive(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href={cta.href}
            className="hidden sm:inline-flex items-center h-10 px-4 rounded-[var(--radius-sm)] bg-brand text-white text-[0.9375rem] font-semibold hover:bg-brand-600 transition-colors"
          >
            {cta.label}
          </Link>
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-[var(--radius-sm)] text-white hover:bg-white/10"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? t.menuClose : t.menuOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* ---------------- Services mega menu ---------------- */}
      <div
        id="menu-services"
        onMouseEnter={() => hoverOpen("services")}
        onMouseLeave={hoverClose}
        className={`hidden lg:block absolute inset-x-0 top-full origin-top transition-[opacity,transform] duration-200 ${
          openMenu === "services" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none invisible"
        }`}
      >
        <div className="container-page">
          <div className="mt-2 grid grid-cols-[1fr_1fr_1fr_17rem] bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-overlay)] overflow-hidden">
            {serviceGroups.map((group) => (
              <div key={group.label} className="p-6 border-r border-line">
                <p className="t-eyebrow text-muted">{group.label}</p>
                <p className="mt-1 text-sm text-muted leading-snug">{group.description}</p>
                <ul className="mt-5 space-y-1">
                  {group.slugs.map((slug) => {
                    const s = serviceBySlug(slug);
                    return (
                      <li key={slug}>
                        <Link href={s.href} className="group flex gap-3 rounded-[var(--radius-sm)] p-2.5 -mx-2.5 hover:bg-mist transition-colors">
                          <IconRenderer name={s.icon} size={20} className="mt-0.5 shrink-0 text-brand" />
                          <span>
                            <span className="block font-semibold text-heading text-[0.9375rem]">{s.name}</span>
                            <span className="block text-[0.8125rem] text-muted leading-snug mt-0.5 line-clamp-2">{s.outcome}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <div className="p-6 bg-ink-950 text-ink-200 flex flex-col">
              <p className="t-eyebrow text-brand-300">{t.menuAssessEyebrow}</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-lg font-semibold text-white leading-snug">
                {t.menuAssessTitle}
              </p>
              <p className="mt-2 text-sm text-ink-300">{t.menuAssessText}</p>
              <Link href="/cybersecurity-assessment/" className="arrow-link mt-auto pt-6 text-white text-sm">
                {t.startAssessment} <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/services" className="arrow-link mt-3 text-ink-300 hover:text-white text-sm">
                {t.allServices} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Industries dropdown ---------------- */}
      <div
        id="menu-industries"
        onMouseEnter={() => hoverOpen("industries")}
        onMouseLeave={hoverClose}
        className={`hidden lg:block absolute inset-x-0 top-full transition-[opacity,transform] duration-200 ${
          openMenu === "industries" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none invisible"
        }`}
      >
        <div className="container-page">
          <div className="mt-2 ml-auto mr-[12rem] w-[34rem] bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-overlay)] p-3">
            <ul className="grid grid-cols-2 gap-0.5">
              {industries.map((ind) => (
                <li key={ind.slug}>
                  <Link href={`/industries#${ind.slug}`} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 hover:bg-mist text-[0.9375rem] font-medium text-heading">
                    <IconRenderer name={ind.icon} size={18} className="text-brand shrink-0" />
                    {ind.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/industries" className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-[0.9375rem] font-semibold text-cobalt hover:bg-mist">
                  How risk differs by sector <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ---------------- Mobile menu ---------------- */}
      <div
        id="mobile-menu"
        className={`lg:hidden fixed inset-x-0 bottom-0 ${compact ? "top-[var(--header-h-compact)]" : "top-[var(--header-h)]"} bg-ink-950 transition-[opacity,transform] duration-300 ${
          mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none invisible"
        }`}
      >
        <nav aria-label={t.mobileNav} className="h-full overflow-y-auto container-page pb-10 pt-2 flex flex-col">
          <ul className="divide-y divide-ink-700 border-b border-ink-700">
            {(["services", "industries"] as const).map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between py-4 text-lg font-semibold text-white"
                  aria-expanded={mobileSection === id}
                  aria-controls={`m-${id}`}
                  onClick={() => setMobileSection(mobileSection === id ? null : id)}
                >
                  {id === "services" ? label("/services", t.services) : label("/industries", t.industries)}
                  <ChevronDown size={20} aria-hidden="true" className={`text-ink-300 transition-transform ${mobileSection === id ? "rotate-180" : ""}`} />
                </button>
                <div id={`m-${id}`} className={`grid transition-[grid-template-rows] duration-300 ${mobileSection === id ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <ul className="pb-4 space-y-0.5">
                      {id === "services"
                        ? [...serviceGroups.flatMap((g) => g.slugs.map(serviceBySlug)).map((s) => ({ href: s.href, label: s.name, icon: s.icon })), { href: "/services", label: t.allServices, icon: "LayoutGrid" }].map((l) => (
                            <li key={l.href}>
                              <Link href={l.href} className="flex items-center gap-3 py-2.5 text-ink-200 hover:text-white">
                                <IconRenderer name={l.icon} size={18} className="text-brand-300 shrink-0" />
                                {l.label}
                              </Link>
                            </li>
                          ))
                        : [...industries.map((i) => ({ href: `/industries#${i.slug}`, label: i.name, icon: i.icon })), { href: "/industries", label: t.allIndustries, icon: "LayoutGrid" }].map((l) => (
                            <li key={l.href}>
                              <Link href={l.href} className="flex items-center gap-3 py-2.5 text-ink-200 hover:text-white">
                                <IconRenderer name={l.icon} size={18} className="text-brand-300 shrink-0" />
                                {l.label}
                              </Link>
                            </li>
                          ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
            {[{ label: t.freeAssessment, href: "/cybersecurity-assessment/" }, ...plainNav].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-4 text-lg font-semibold text-white" aria-current={isActive(l.href) ? "page" : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link href={cta.href} className="flex items-center justify-center h-12 rounded-[var(--radius-sm)] bg-brand text-white font-semibold">
              {cta.label}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
