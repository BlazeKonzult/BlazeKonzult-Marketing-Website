"use client";

import { useEffect, useState } from "react";
import Button from "./Button";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop sticky CTA */}
      <div
        className={`hidden lg:flex fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Button href="/contact" size="lg" className="shadow-lg">
          Book a Free Discovery Call
        </Button>
      </div>

      {/* Mobile sticky CTA bar */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-light-lavender px-4 py-3 transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <Button href="/contact" size="md" className="w-full">
          Book a Free Discovery Call
        </Button>
      </div>
    </>
  );
}
