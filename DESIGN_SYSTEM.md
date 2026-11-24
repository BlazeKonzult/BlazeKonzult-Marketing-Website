# BlazeKonzult Design System

The public website's visual language: tokens, typography, components and the rules for using them. Tokens live in `src/app/globals.css`; components live in `src/components/`.

## 1. Brand direction

**Navy-led, with the BlazeKonzult purple as the signature accent.**

The existing brand is purple: the "K" badge logo and the previous site. The brief proposed a navy and blue palette but also asked to preserve brand recognition. The decision was:

- Midnight navy (`#081421`) carries authority and is the dominant dark surface for heroes, the assessment band, closing CTAs and the footer.
- The **logo is unchanged**: the purple gradient "K" badge. On dark surfaces the wordmark is white with "Konzult" in light purple.
- **Purple is the only action colour.** Every primary button, the active nav underline and the selected states use it, so "purple = do this" holds across the site.
- Electric blue and cyan appear **only inside data visualisations** (charts, diagrams, status dots). They are never used for text links or buttons.
- Light sections use an off-white page (`paper`) and white panels, with hairline borders instead of shadows and cards.

What we deliberately avoided, per the brief: glassmorphism, neon gradients, padlock or shield illustrations, hooded-hacker imagery, stock photography, emoji, invented testimonials and invented statistics.

## 2. Colour tokens

Defined in `@theme` and exposed as Tailwind utilities (`bg-ink-950`, `text-muted`, `border-line` and so on).

| Token | Value | Use |
|---|---|---|
| `ink-950` | `#081421` | Midnight navy: primary dark surface |
| `ink-900` | `#0D1B2A` | Raised dark surface (trust strip, panels on dark) |
| `ink-800` | `#132538` | Inputs and fills on dark |
| `ink-700` | `#1C3249` | Hairlines on dark |
| `ink-600` | `#2B4562` | Stronger lines on dark |
| `ink-300` | `#9FB0C4` | Secondary text on dark |
| `ink-200` | `#C9D4E1` | Body text on dark |
| `paper` | `#F7F9FC` | Light page background |
| `mist` | `#EEF2F8` | Subtle panels on light |
| `line` | `#DDE4EE` | Hairlines on light |
| `heading` | `#0B1726` | Headings on light |
| `body` | `#334155` | Body text on light |
| `muted` | `#5D6B80` | Secondary text on light |
| `brand` | `#6D3BEA` | BlazeKonzult purple: actions, eyebrows, selected states |
| `brand-600` | `#5A2BD4` | Hover and pressed state of `brand` |
| `brand-300` | `#B39DFA` | Purple text on dark |
| `brand-50` | `#F1EDFF` | Selected answer background (assessment) |
| `cobalt` | `#1649A8` | Text links on light |
| `azure` | `#3478F6` | Data visualisation only |
| `signal` | `#00B8D9` | Data visualisation and status dots only |
| `ok` / `warn` / `risk` | `#0B7D5E` / `#A35D00` / `#D14343` | Maturity levels and risk/priority labels |

### Contrast (WCAG 2.2), calculated

Every text pair used in the UI meets AA (4.5:1) for normal text:

| Pair | Ratio |
|---|---|
| `body` on `paper` | 9.82 |
| `muted` on `paper` / on `mist` | 5.13 / 4.82 |
| `brand` text on `paper` | 5.75 |
| White on `brand` button | 6.06 |
| `cobalt` link on `paper` | 7.80 |
| `ok` / `warn` / `risk` on white | 5.11 / 5.09 / 4.57 |
| `ink-200` / `ink-300` / `brand-300` on `ink-950` | 12.35 / 8.37 / 8.05 |

`ok`, `warn` and `muted` were darkened during QA because the first values failed (see `UI_UX_REVIEW.md`).

## 3. Typography

| Role | Family | Notes |
|---|---|---|
| Display and headings | **Manrope** 600–700 | Tight negative tracking (−0.02 to −0.035em), `text-wrap: balance` |
| Body | **Inter** 400–600 | 16px base, 1.65 line height, `text-wrap: pretty` |
| Technical details | **JetBrains Mono** 400–500 | Eyebrows, step numbers, dates, diagram labels |

All three fonts are self-hosted through `next/font`, so visiting the site makes no third-party font requests (this matters for the cookie and privacy policy).

### Fluid type scale (CSS `clamp`)

| Class | Mobile → desktop | Use |
|---|---|---|
| `.t-display` | 38px → 68px | Homepage hero only |
| `.t-h1` | 32px → 52px | Page heroes, closing CTAs |
| `.t-h2` | 28px → 42px | Section headings |
| `.t-h3` | 19px → 23px | Item headings |
| `.t-lead` | 17px → 20px | Intro paragraphs |
| `.t-eyebrow` | 12px mono, uppercase, 0.14em tracking | Section labels |

The hero headline is capped at about 68px so it never consumes the whole viewport, as the brief requires.

## 4. Spacing, layout and radii

| Token | Value |
|---|---|
| `--container` | 76rem (1216px) content width |
| `--container-narrow` | 46rem for legal pages and long text |
| `--gutter` | `clamp(1rem, 0.4rem + 3vw, 2.5rem)`: 16px on a 320px phone, 40px on desktop |
| `--space-section` | `clamp(4rem, 2.8rem + 5vw, 7.5rem)` vertical section rhythm |
| `--space-block` | `clamp(2.5rem, 2rem + 2.5vw, 4rem)` |
| `--header-h` / `--header-h-compact` | 72px / 60px |
| Radii | `xs` 3px · `sm` 6px (buttons, inputs) · `md` 10px (panels) · `lg` 16px |
| Breakpoints | Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280) plus `xs` 430px |

Radii are deliberately small. Large rounded cards were one of the "generic AI template" signals the brief asked us to avoid.

### Layout patterns (used instead of repeated card grids)

- **Sticky intro + ruled list**: Challenges, Services overview, FAQ.
- **Editorial rows**: service rows with category, name, description and arrow, separated by hairlines.
- **Feature pair**: Health Check (light) next to NIS2 (dark) on the homepage.
- **Hairline grid**: deliverables use a 1px gap on a `line` background instead of separate cards.
- **Split with visual**: page heroes with a service-specific diagram.
- **Tabbed explorer**: industries, one sector in focus at a time.

## 5. Shadows and motion

| Token | Use |
|---|---|
| `--shadow-raised` | Forms and hover state of related-service links |
| `--shadow-overlay` | Mega menu, diagram frames |
| `--dur-fast` / `--dur-base` / `--dur-slow` | 150 / 250 / 600ms |
| `--ease-out-soft` | `cubic-bezier(0.2, 0.7, 0.2, 1)` |

**Motion uses native CSS only, with no animation library:**

- `.reveal`: scroll-driven entrance (`animation-timeline: view()`). Browsers without support simply show the content.
- `.reveal-line`: the methodology connector draws in on scroll.
- `.hero-enter*`: a staggered fade-up on page load.
- `animate-dash` / `animate-pulse-node`: slow traffic and pulse effects in the diagrams.
- Accordion, mega menu and mobile menu use transitions on `grid-template-rows`, opacity and transform.
- `prefers-reduced-motion: reduce` turns all of the above off.

## 6. Focus and interactive states

- Focus ring: `0 0 0 3px paper, 0 0 0 5px brand` on light surfaces, and `brand-300` on dark (`.on-dark` wrapper). Shown on `:focus-visible` only.
- Buttons: hover darkens, press translates 1px down, arrow nudges 2px on hover.
- Links: `cobalt` underline offset 3px, turning purple on hover. Arrow links animate the arrow.
- Form fields: `line` border, darker on hover, `brand` border plus a soft purple ring on focus, and a `risk` border when invalid.
- Selected states: `aria-pressed` and `aria-selected` styles use ink-950 fill (filters, tabs) or `brand-50` fill with a `brand` border (assessment answers).

## 7. Components

| Component | File | Notes |
|---|---|---|
| Header with mega menu | `components/Header.tsx` | Transparent over the hero, compact solid on scroll (>24px). Services mega menu (3 groups + assessment promo), Industries dropdown, Escape/outside-click close, hover intent delay. Mobile: full-height panel with accordion groups. |
| Footer | `components/Footer.tsx` | Company, Services, Industries, Resources, Company, legal row with language label |
| Button | `components/Button.tsx` | `primary` / `secondary` / `inverse` / `light`, `md`/`lg`, optional arrow; wraps text below 640px |
| SectionIntro | `components/SectionIntro.tsx` | Eyebrow + heading + lead, light or dark tone |
| PageHero | `components/PageHero.tsx` | Dark hero with breadcrumbs and optional aside visual |
| FAQAccordion | `components/FAQAccordion.tsx` | `aria-expanded`/`aria-controls`, animated rows |
| CtaBand | `components/CtaBand.tsx` | Closing conversion band |
| ServicePage | `components/ServicePage.tsx` | Template for all service pages (section 8) |
| IndustryExplorer | `components/IndustryExplorer.tsx` | WAI-ARIA tabs with arrow-key navigation |
| Assessment | `components/assessment/Assessment.tsx` | 7-step self-assessment with results and review request |
| ArticleCard / ArticleExplorer | `components/Article*.tsx` | Search and category filter on Insights |
| Forms | `ContactForm`, `LeadMagnetForm`, `NewsletterForm` | Shared `.field`, `.field-label`, `.check`, `.btn-submit`, `.form-error` |

### Original visuals (no stock imagery)

| Visual | File | What it shows |
|---|---|---|
| Hero | `visuals/HeroVisual.tsx` | Core assets protected by six control domains, connected to cloud services, partners and remote users |
| Service diagrams | `visuals/ServiceDiagram.tsx` | One per service: maturity baseline, Cbw reporting timeline, governance cadence, monthly improvement loop, inbox-to-containment flow, response phases, assurance workflow |
| Assessment preview | `visuals/AssessmentPreview.tsx` | Example results view, labelled **"Illustrative example"** |
| Article covers | `visuals/ArticleCover.tsx` | Generated per category, so there are no repeated stock photos |

The only photograph is the founder's own headshot.

## 8. Content model (structured, no free-form layout)

Content is separated from layout so it can be edited without breaking the design:

| File | Contains |
|---|---|
| `src/lib/data.ts` | Company info, services, service groups, credentials, frameworks, challenges, differentiators, methodology, industries, home FAQs, article metadata |
| `src/lib/serviceContent.ts` | Per-service page content (hero, value proposition, problems, deliverables, outcomes, method, regulatory context, optional roadmap/tiers/checklist, related services, FAQs, closing CTA) |
| `src/lib/articleContent.ts` | Article bodies as heading, paragraph and list blocks |
| `src/lib/assessment.ts` | Assessment categories, questions, scale, recommendations, maturity thresholds |

The service template varies by content: the NIS2 page leads with regulatory context, Health Check adds a sample 90-day roadmap, Virtual CISO adds engagement levels, and NIS2 and Supplier Assurance include a checklist request.

The structure is ready for a CMS: each file maps one-to-one to a CMS collection. A CMS was out of scope for this phase (static cPanel hosting).

## 9. Conversion paths

| Goal | Where |
|---|---|
| **Book a consultation** (primary) | Header CTA, every hero, every closing band → `/contact` |
| Readiness assessment | Homepage section 6, mega menu, service heroes, article sidebar → `/assessment`; results can be sent to BlazeKonzult |
| Enquiry | `/contact` form → `contact.php` |
| Resource request | Checklist forms on Insights, NIS2 and Supplier Assurance |
| Insights subscription | Newsletter form on Insights |

There are no pop-ups, countdowns or scarcity messages. The old sticky bottom CTA bar was removed as intrusive.

## 10. Not yet built (deliberately)

- **CMS and admin dashboard**: deferred to a later phase; current hosting is static cPanel.
- **Dutch language**: English only for now. The footer states the language, and the switcher was not built because no translations exist yet.
- **Testimonials**: no component is shown until real, permissioned client quotes exist.
- **Cookie preferences**: the site sets no cookies and loads no third-party scripts, so there is nothing to consent to. The footer links to the Cookie Policy.
