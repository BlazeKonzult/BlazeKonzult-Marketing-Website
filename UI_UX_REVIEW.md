# BlazeKonzult UI/UX Review

A record of the browser-based design review carried out on the redesigned public website. All checks below were **actually run**: the static production build (`npm run build` → `out/`) was served locally and driven with Playwright (headless Chromium, `playwright@1.56.0`).

- **Date:** 23 November 2026
- **Build reviewed:** static export, 30 routes
- **Screenshots:** `docs/ui-review/` (final round, JPEG)
- **Automated results:** `docs/ui-review/qa-report.json`

## 1. Method

1. **Automated sweep.** 17 pages × 8 viewport widths = 136 combinations (320, 375, 390, 430, 768, 1024, 1440, 1920px). For each one the script:
   - scrolls the full page so lazy images load;
   - checks for horizontal document scroll (`scrollWidth > clientWidth`);
   - lists elements extending beyond the viewport;
   - flags **clipped text**: headings, paragraphs, links, buttons, labels and list items cut off by the viewport edge, excluding intentional horizontal scrollers;
   - records console errors and uncaught exceptions.
2. **Full-page screenshots** at 390 and 1440px for every page, and at all 8 widths for the homepage. These were reviewed by eye, section by section.
3. **Interaction tests** in a real browser:
   - Services mega menu and Industries dropdown, with Escape to close;
   - sticky compact header after scrolling;
   - industry explorer tab click and ArrowDown keyboard navigation;
   - mobile menu with an expanded Services group;
   - a complete 21-question assessment run through to the results view.
4. **Contrast** computed with the WCAG relative-luminance formula for every text and background pair used.
5. **Reduced motion.** Screenshots were captured with `prefers-reduced-motion: reduce` emulated, which also verifies that content is fully visible when animations are off.

## 2. Pages reviewed

| Page | Desktop | Mobile |
|---|---|---|
| Home | `home-1440.jpg` (+ 1920, 1024, 768) | `home-430/390/375/320.jpg` |
| Services overview | `services-1440.jpg` | swept |
| Cybersecurity Health Check | `cybersecurity-health-check-1440.jpg` | `cybersecurity-health-check-390.jpg` |
| NIS2 Readiness | `nis2-readiness-1440.jpg` | `nis2-readiness-390.jpg` |
| Virtual CISO | `virtual-ciso-1440.jpg` | swept |
| Managed Security, Awareness, Incident Response, Supplier Assurance | swept | swept |
| Industries | `industries-1440.jpg` | `industries-390.jpg` |
| Readiness assessment | `assessment-1440.jpg`, `interaction-assessment-*.jpg` | `assessment-390.jpg`, `interaction-assessment-mobile.jpg` |
| About | `about-1440.jpg` | `about-390.jpg` |
| Insights + article | `resources-1440.jpg`, `resources_nis2-…-1440.jpg` | swept |
| Contact | `contact-1440.jpg` | `contact-390.jpg` |
| Privacy policy | swept | swept |
| 404 | `does-not-exist-1440.jpg` | swept |
| Navigation | `interaction-mega-menu.jpg`, `interaction-industries-menu.jpg`, `interaction-sticky-header.jpg` | `interaction-mobile-menu.jpg` |

"Swept" means the page passed the automated checks at all 8 widths and its 390/1440 full-page screenshot was generated. Not every one of those was inspected section by section.

## 3. Issues found and fixed

| # | Round | Issue | Where | Fix |
|---|---|---|---|---|
| 1 | 1 | Horizontal scroll of 18–37px on phones | Home, founder photo | The decorative offset frame was translated outside its container. It is now drawn inside padded space. |
| 2 | 1 | Hero diagram label clipped to "E USERS" | Home hero visual | The label overflowed the SVG viewBox. It now sits above its node. |
| 3 | 1 | Credentials and "We help you navigate" rows misaligned | Home trust strip | Both rows now share one `11rem` label grid column. |
| 4 | 1 | Most content blank in full-page screenshots | All pages | Capture artefact: the scroll-driven reveals sit at their "before entry" state when the page is captured from the top. QA now emulates reduced motion, which also confirms content is visible without animation. In normal browsing, content reveals as it scrolls into view. |
| 5 | 2 | 1px horizontal scroll at exactly 430px | Home hero | Not 1px cosmetic: two `nowrap` CTA buttons side by side at the 430px `xs` breakpoint stretched the hero text column to 579px, **clipping the hero copy**. Button pairs now stack until 640px, and hero grids use `minmax(0, 1fr)` columns. |
| 6 | 3 | Overflow check missed text clipped inside `overflow-hidden` sections | QA script | Added a dedicated clipped-text check. |
| 7 | 3 | Closing CTA text and buttons clipped at 320–390px | NIS2 Readiness | The long label "Request a NIS2 Readiness Assessment" could not wrap. Buttons now wrap below 640px, and the CTA band grid uses `grid-cols-1`. |
| 8 | 4 | Hero diagram labels hard to read on phones | Home hero | Domain labels enlarged from 12.5 to 14 units, mono labels from 11 to 12. |
| 9 | 4 | "Remote users" label crossed a connection line | Home hero | Moved above its node. |
| 10 | 4 | Score labels ("67% · Established") wrapped to two lines | Assessment results | Wider label column, `nowrap`. |
| 11 | 4 | Large empty column under the results summary | Assessment results | Summary card is now sticky on desktop. |
| 12 | 4 | Footer text overflowed its frame | NIS2 diagram | Frame widened, font reduced to 9.5. |
| 13 | 4 | Regulatory list numbers not aligned | Service pages | Fixed-width number column. |
| 14 | 4 | Search icon overlapped the "Search articles…" placeholder | Insights | Root cause: the design-system classes (`.field`, type scale, layout) were unlayered CSS, so they silently overrode Tailwind utilities such as `pl-10`. Moved into `@layer base` / `@layer components` so utilities can refine them. Re-verified all pages afterwards. |
| 15 | 5 | Contrast failures | Global tokens | `warn` #d98a00 on paper was 2.62:1, `ok` #12a07a on white was 3.31:1, `muted` on mist was 4.24:1. Darkened to `#A35D00` (4.83), `#0B7D5E` (5.11) and `#5D6B80` (4.82). |
| 16 | 5 | Unused variable lint warning | Hero visual | Removed. |

Issues were fixed in rounds 1–5 and re-tested after each round. The final round is in `docs/ui-review/`.

## 4. Final results (last round)

- **136/136** page × width combinations with **no horizontal scroll**.
- **0** elements overflowing the viewport, **0** clipped text elements.
- **0** console errors or exceptions, excluding the intentional request to a missing URL to test the 404 page; the test server returns 404 for that request, as expected.
- Interaction tests pass:
  - mega menu and dropdown open and close with Escape;
  - the header compacts on scroll;
  - the industry tabs respond to click and arrow keys;
  - the mobile menu accordion works;
  - the assessment completes all 7 steps and produces a profile ("Developing", 46% for the test answer pattern) with domain scores, strengths and three prioritised recommendations.
- `tsc --noEmit` and `eslint` pass with no errors or warnings.

## 5. Design-quality review against the brief

**What works**

- **Distinct sections.** Challenges are a sticky intro with a ruled two-column list. Services are a featured pair followed by editorial rows. The industries explorer is tabbed. Methodology is a horizontal timeline on desktop and a vertical one on mobile. Leadership is a photo plus bio, and Insights is a magazine layout. No two consecutive sections share a layout.
- **Purposeful visuals.** Every diagram explains something:
  - control domains around core assets;
  - Cbw reporting deadlines;
  - the governance cadence;
  - the improvement loop.
  There is no padlock, shield or hacker imagery.
- **Honest trust signals.** These are limited to verified founder certifications and the frameworks the consultancy works with. The assessment preview is labelled "Illustrative example". There are no invented testimonials, client logos or statistics.
- **Hero.** The headline is capped at about 68px and does not take over the viewport. CTAs are visible above the fold at 1440×900 and 390×844.

**Known trade-offs and remaining items**

- **Hero diagram on small phones.** At 320–390px the diagram labels render at about 8–9px. The diagram is decorative and has a full text alternative (`<title>`). A simplified mobile variant could be considered.
- **Industry tabs on mobile** scroll horizontally. This is intentional; the cut-off tab signals more options.
- **Visual verification coverage.** Full visual inspection was done on Home (all widths), NIS2, Health Check, Services, Industries, Assessment, About, Insights and Contact. The remaining service pages share the reviewed template and passed all automated checks, but were not inspected section by section.
- **Browsers.** Only Chromium was tested. Safari and Firefox were not tested in this session. Scroll-driven reveals fall back to static content where unsupported.
- **Accessibility.** No automated tool such as axe was run, and no manual screen-reader pass was done. Semantics follow WAI-ARIA patterns (tabs, accordion, disclosure menus, labelled forms, breadcrumbs, skip link).
- **Out of scope for this phase:** the CMS and admin dashboard, the Dutch translation and language switcher, and real client testimonials.

## 6. How to reproduce

```bash
npm run build                      # writes ./out
cd out && python3 -m http.server 8200
# Run the Playwright scripts used for this review against http://127.0.0.1:8200
```
