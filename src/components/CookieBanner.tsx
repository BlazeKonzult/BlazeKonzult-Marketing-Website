"use client";

import { useEffect, useState } from "react";

/**
 * GDPR-conscious cookie consent banner.
 * PLACEHOLDER: connect "Accept" / "Reject non-essential" actions to your
 * actual analytics/consent-management setup (e.g. only load a
 * privacy-conscious analytics script such as Plausible/Fathom after
 * consent). Essential cookies (e.g. session, security) do not require
 * consent under Dutch/EU rules but should still be documented in the
 * Cookie Policy.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = typeof window !== "undefined" ? localStorage.getItem("bk-cookie-consent") : "given";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing one-time localStorage read into state
    if (!consent) setVisible(true);
  }, []);

  function respond(choice: "accepted" | "rejected") {
    localStorage.setItem("bk-cookie-consent", choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-heading"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-light-lavender shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="container-page py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h2 id="cookie-banner-heading" className="text-sm font-bold text-deep-purple mb-1">
            Your privacy matters to us
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            We use essential cookies to run this site, and optional, privacy-conscious analytics cookies to
            understand how visitors use it. See our{" "}
            <a href="/cookie-policy" className="underline hover:text-primary-purple">Cookie Policy</a> for details.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => respond("rejected")}
            className="rounded-full border-2 border-primary-purple text-deep-purple px-5 py-2.5 text-sm font-semibold min-h-11 hover:bg-light-lavender"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={() => respond("accepted")}
            className="rounded-full bg-primary-purple text-white px-5 py-2.5 text-sm font-semibold min-h-11 hover:bg-deep-purple"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
