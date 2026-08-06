"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import Button from "./Button";
import { mainNav } from "@/lib/data";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile menu on route change
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur shadow-sm border-b border-light-lavender"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <a href="#main-content" className="sr-only-focusable fixed top-2 left-2 z-[60] bg-deep-purple text-white px-4 py-2 rounded-md">
        Skip to main content
      </a>
      <div className="container-page flex items-center justify-between h-18 py-3">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {mainNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                pathname === link.href
                  ? "text-primary-purple bg-light-lavender"
                  : "text-text-dark hover:text-primary-purple hover:bg-light-lavender"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          {/* PLACEHOLDER: replace href with real calendar-booking URL from companyInfo.bookingUrl */}
          <Button href="/contact" size="md">
            Book a Free Discovery Call
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-full text-deep-purple hover:bg-light-lavender"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="lg:hidden bg-white border-t border-light-lavender shadow-lg animate-fade-up"
        >
          <nav className="container-page py-4 flex flex-col gap-1" aria-label="Mobile">
            {mainNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3.5 rounded-xl text-base font-medium text-text-dark hover:bg-light-lavender min-h-12 flex items-center"
              >
                {link.label}
              </Link>
            ))}
            <Button href="/contact" size="lg" className="mt-3 w-full">
              Book a Free Discovery Call
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
