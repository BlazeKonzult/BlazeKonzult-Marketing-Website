# BlazeKonzult Website — Placeholders & Design Notes

This is a production-quality Next.js (App Router) + TypeScript + Tailwind CSS
frontend prototype for BlazeKonzult. Sample content is used throughout where
real company information was not provided — no client names, testimonials,
regulatory approvals, prices or performance claims have been invented.

## Getting started

```bash
npm install
npm run dev      # local development at http://localhost:3000
npm run build    # production build
```

## Design decisions

- **Wordmark logo** (`src/components/Logo.tsx`): a geometric "K" built from
  straight strokes and a small gradient connection node, set inside a
  rounded-square purple gradient badge next to a Manrope bold wordmark. It
  reads cleanly at favicon size and avoids padlocks/shields/hackers per the
  brief.
- **Colour system** (`src/app/globals.css`): the full purple palette supplied
  in the brief is defined as CSS variables and exposed as Tailwind utilities
  (`bg-deep-purple`, `text-primary-purple`, `bg-light-lavender`, etc.), plus a
  muted teal "resilience" accent used sparingly for positive/status
  indicators. Deep purple anchors navigation, headings and primary buttons;
  lavender/off-white keep backgrounds calm and spacious.
- **Typography**: Manrope for headings (confident, executive-friendly),
  Inter for body copy — both loaded via `next/font/google` for performance
  and self-hosting (no external font requests at runtime).
- **Components**: all major building blocks are reusable — `Header`,
  `Footer`, `Button`, `ServiceCard`, `TestimonialCard`, `FAQAccordion`,
  `PageHero`, `ProcessSteps`, `ContactForm`, `LeadMagnetForm`, `ArticleCard`,
  `CookieBanner`, `JsonLd`, etc. — organised under `src/components/`.
- **Content data**: shared copy (services, FAQs, sectors, articles, nav) is
  centralised in `src/lib/data.ts` so it is easy to update without touching
  page markup.
- **Accessibility**: skip link, semantic landmarks, visible focus states,
  44px+ touch targets, accordion with proper `aria-expanded`/`aria-controls`,
  labelled form fields, honeypot spam field, `prefers-reduced-motion`
  support, and no information conveyed by colour alone.
- **SEO**: per-page `metadata`, canonical URLs, `sitemap.ts`, `robots.ts`,
  and JSON-LD for `ProfessionalService` (root layout), `Person` (About),
  `FAQPage` (Home, Health Check, NIS2), `Article` and `BreadcrumbList`
  (article template).
- **Tone**: no fear-based messaging. NIS2 copy deliberately uses
  "may apply" / "potential obligations" / "readiness guidance" language and
  is not presented as legal advice.

## Known placeholders to replace before launch

Search the codebase for `PLACEHOLDER` (case-sensitive) to find every
instance in context. Key items:

- **`src/lib/data.ts`** — `companyInfo` object: business address, phone
  number, business email, LinkedIn company URL, calendar-booking URL
  (Calendly/Cal.com/etc.).
- **Founder headshot** — placeholder blocks in `src/app/page.tsx` (home) and
  `src/app/about/page.tsx`; replace with a real photo via `next/image`.
- **Testimonials & case studies** — `src/components/TestimonialCard.tsx`
  usage on the homepage uses clearly labelled sample/placeholder content
  only; replace with real, permissioned client testimonials.
- **Downloadable checklist files** — `LeadMagnetForm` components reference a
  "Cyber Resilience Checklist" and "NIS2 Supplier Readiness Checklist" PDF
  that do not yet exist; produce the PDFs and wire up delivery (e.g. email
  automation) once ready.
- **Form backends** — `ContactForm.tsx` and `LeadMagnetForm.tsx` currently
  simulate submission client-side only. Before launch, connect them to a
  secure server-side endpoint (Next.js Route Handler, or a form service like
  Formspree/HubSpot) with server-side validation, rate limiting and spam
  protection. Do not expose submissions in client-side code.
- **Newsletter signup** — `src/app/resources/page.tsx` needs a real provider
  (e.g. Mailchimp/Brevo) connected server-side.
- **Cookie banner / analytics** — `src/components/CookieBanner.tsx` stores
  consent in `localStorage`; connect "Accept" to actually load a
  privacy-conscious analytics script (e.g. Plausible/Fathom) only after
  consent, per the Cookie Policy.
- **Legal pages** — `privacy-policy`, `cookie-policy` and
  `responsible-disclosure` pages contain structurally complete but legally
  unreviewed draft text. Have these reviewed by qualified legal counsel
  before publishing, and insert the final cookie inventory once analytics
  tooling is finalised.
- **Article body content** — `src/app/resources/[slug]/page.tsx` renders a
  short placeholder body for each article; replace with the full written
  articles.
- **Site domain** — `siteUrl`/`baseUrl` constants in `src/app/layout.tsx`,
  `src/app/sitemap.ts` and `src/app/robots.ts` currently point to
  `https://www.blazekonzult.example`; update to the real production domain.
- **Structured data address** — the `ProfessionalService` JSON-LD in
  `src/app/layout.tsx` only sets `addressCountry: "NL"`; add the full
  postal address once available.
- **Security/ops hardening** (recommended, not yet implemented in this
  frontend prototype): HTTPS/HSTS at the hosting layer, Content-Security-
  Policy headers, secure cookie flags, admin authentication with MFA,
  automated dependency updates, regular backups, and SPF/DKIM/DMARC for the
  business email domain.

## Icons

All icons use `lucide-react` (line icons, no brand/social icon set in this
version) except the LinkedIn glyph, which is a small custom inline SVG in
`src/components/LinkedinIcon.tsx`.
