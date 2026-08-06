import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import LinkedinIcon from "./LinkedinIcon";
import Logo from "./Logo";
import { companyInfo, services } from "@/lib/data";

const companyLinks = [
  { label: "About the Founder", href: "/about" },
  { label: "Resources and Insights", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Responsible Disclosure", href: "/responsible-disclosure" },
];

export default function Footer() {
  return (
    <footer className="bg-deep-purple text-white mt-24">
      <div className="container-page py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <Logo variant="light" />
          <p className="mt-4 text-sm text-white/80 max-w-xs">{companyInfo.tagline}</p>
          <p className="mt-2 text-sm text-white/60 max-w-xs">Cybersecurity services for Dutch MSMEs</p>
          <div className="flex items-center gap-3 mt-5">
            {/* PLACEHOLDER: replace with real LinkedIn company URL */}
            <a
              href={companyInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="BlazeKonzult on LinkedIn"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <LinkedinIcon size={18} />
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-4">Services</h2>
          <ul className="space-y-2.5">
            {services.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link href={s.href} className="text-sm text-white/85 hover:text-white">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-4">Company</h2>
          <ul className="space-y-2.5">
            {companyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-white/85 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60 mt-6 mb-4">Legal</h2>
          <ul className="space-y-2.5">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-white/85 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-4">Contact</h2>
          <ul className="space-y-3 text-sm text-white/85">
            <li className="flex items-start gap-2">
              <Mail size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {/* PLACEHOLDER: replace with real business email */}
              <span>{companyInfo.email}</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {/* PLACEHOLDER: replace with real phone number */}
              <span>{companyInfo.phone}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {/* PLACEHOLDER: replace with real registered address */}
              <span>{companyInfo.serviceArea}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <p>© {new Date().getFullYear()} BlazeKonzult. All rights reserved.</p>
          <p>Founded by {companyInfo.founder}</p>
        </div>
      </div>
    </footer>
  );
}
