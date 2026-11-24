# BlazeKonzult Command Centre: admin redesign status

The admin at `/admin` has been rebuilt as the **BlazeKonzult Command Centre**. This file records what was built, the decisions behind it, how it was tested and what remains.

- **Date:** 24 November 2026
- **Stack:** unchanged. Next.js 16 client app at `/admin`, Express + MySQL API under `/api/admin`, one Node process (`server.js`).
- **Screenshots:** `docs/admin-review/` (JPEG, light and dark, 1440 / 768 / 390 px).
- **Automated browser results:** `docs/admin-review/qa-report.json`.

## 1. Progress by phase

| Phase | Status | Notes |
|---|---|---|
| 1. Audit | Done | Hash-routed single-page admin, a 15rem sidebar, a narrow `max-w-7xl` container, `window.confirm`/`prompt` dialogs, no theme support, and no dashboard comparisons or activity feed. |
| 2. Design system | Done | Admin tokens are in `globals.css` (`.admin-root`), with separately designed light and dark themes, a validated chart palette and motion tokens. |
| 3. Application shell | Done | Collapsible grouped sidebar with live badges, top bar, breadcrumbs, ⌘K palette, notifications, theme menu, account menu, mobile drawer, toasts and dialogs. |
| 4. Executive dashboard | Done | Period selector, 8 KPI cards with comparison and sparklines, time-series chart, pipeline, maturity, website overview, quick actions, activity and needs-attention panels. |
| 5. Content management | Done, with limits | Pages and articles tables, a three-panel editor with publishing inspector and live preview, a media library and an SEO centre. See §6 for what is not built. |
| 6. CRM | Done | Lead table, Kanban pipeline, lead workspace, follow-ups, consultation and enquiry views. |
| 7. Assessments | Done (restyled and extended) | Template list and builder (drag ordering, validation, preview modal), question bank, rules, results and reports. |
| 8. Reports and analytics | Done | Business analytics workspace with six views, assessment analytics and reports. |
| 9. Administration and security | Done | Users, roles matrix, Security centre, System health, audit log filters, email delivery, privacy, My account. |
| 10. Responsive and accessibility | Done | 34 screens × 3 widths × 2 themes checked; axe on every desktop screen. |
| 11. Visual refinement | Done | Four review rounds; see §5. |
| 12. Tests and documentation | Done | 33 backend tests, 17 browser interaction checks, this file. |

## 2. Architectural decisions

- **No new dependencies.** Charts, command palette, tables, dialogs, drag-and-drop and the Kanban board are hand-built (native SVG, HTML5 drag-and-drop, CSS). The production bundle gains no libraries.
- **Theme by re-pointing tokens.** Inside `.admin-root`, the Tailwind colour variables (`--color-heading`, `--color-line`, `--color-surface` and so on) are redefined for light and dark. Every existing admin screen therefore follows the theme without per-component code. Dark mode is a separate palette, not an inversion: surfaces `#0B111C`/`#121A28`, text `#F2F4F7`/`#CED5E0`, and status colours lifted for contrast.
- **No flash of the wrong theme.** An inline script on `/admin` applies the saved theme before first paint. The choice is stored in the browser and on the account (`user_prefs`), so it follows the user across devices.
- **Chart palette validated, not eyeballed.** Light uses `#6D3BEA`, `#EB6834`, `#1BAF7A`, `#2A78D6`; dark uses `#9085E9`, `#D95926`, `#199E70`, `#3987E5`. Both pass lightness, chroma, colour-blind separation and contrast checks. The first proposal (purple next to blue) failed the colour-blindness check and was replaced. Every chart also has a legend, printed values, a table view and CSV export.
- **Real data only.** Every metric comes from database records. Comparisons show "No earlier data" when there is no history, and rates show "–" when the denominator is 0. Services the app cannot check (backups, Search Console, website traffic) are labelled "Not checked" or "Not configured", never shown as healthy.
- **Server-side authorization unchanged and extended.** Every new endpoint uses `requireCap`:
  - Lead names appear in the activity feed and search only for roles with lead access.
  - The Security centre shows other users' sessions only to owners.
  - Revoking another user's session needs the `users` capability.
  - Lead search runs on decrypted data inside the server and never sends anything to third parties.
- **Same-origin framing.** The site's `X-Frame-Options` changed from `DENY` to `SAMEORIGIN` so the editor can preview pages in a frame. The API still sends `frame-ancestors 'none'`.
- **Schema changes are additive and automatic.**
  - New tables: `user_prefs` and `redirects`.
  - New columns: `leads.next_follow_up_at`, `leads.last_contacted_at`, `admin_sessions.label`.
  - `migrate` (also run by `seed` and by the preview script) adds missing columns. No existing data is touched.

## 3. Components and endpoints

**Frontend** (`src/components/admin/`):

| File | Contains |
|---|---|
| `ui.tsx` | Page and section headers, Card, Btn, IconBtn, Badge and StatusBadge, Field, Switch, SearchInput, FilterBar, skeletons, EmptyState, ErrorBox, Notice, Table, Pager, Tabs, Modal, `confirmDialog`/`promptDialog` (replacing browser pop-ups), Menu, Toaster, DL |
| `shell.tsx` | AdminLayout, Sidebar, Breadcrumbs, CommandPalette, notification popover, theme menu, quick-create menu, account menu |
| `nav.ts` | Navigation architecture. Only implemented, permission-checked screens are listed. |
| `charts.tsx` | LineChart (crosshair tooltip, legend toggles, table view, CSV), Sparkline, MetricCard, BarList, ScoreRing |
| `datatable.tsx` | DataTable: sorting, column visibility (remembered), row selection, bulk bar, skeleton, empty state, card layout on phones |
| `dashboard.tsx` | Executive dashboard and PeriodPicker |
| `crm.tsx` | Lead views (all, consultations, enquiries, follow-ups), Pipeline, LeadWorkspace |
| `ops.tsx` | Notifications, Activity centre, Security centre, System health, Roles & permissions, Administrator guide |
| `seo.tsx` | SEO overview with search-result preview and inline editing, URL redirects, Localization |
| `analytics.tsx` | Business analytics |
| `sitecontent.ts` | Merges saved content over defaults (what the site renders) for status, SEO, broken-link and translation checks |
| `system.tsx` | Website settings, Users, Email delivery, Privacy & retention, Audit log, My account |
| `website.tsx` | Field editors, page editor with structure navigation, publishing inspector and preview, pages list, articles, media library with drag-and-drop uploads and progress, media picker |
| `content.tsx`, `data.tsx` | Assessment builder screens and results, restyled |

**Backend:**

- `backend/src/command.ts` provides:

  | Area | Endpoints |
  |---|---|
  | Dashboard and activity | `GET /dashboard`, `/activity`, `/counts`, `/attention`, `/search` |
  | Notifications and preferences | `/notifications` (+ `/read`), `/prefs` |
  | Leads | `/leads/pipeline`, `POST /leads/bulk`, `/leads/:id/timeline` |
  | Security | `/security`, `DELETE /sessions/:sid`, `/roles` |
  | System and content | `/health`, `/redirects` (CRUD), `/content-bulk` |

- `backend/src/redirects.ts` validates redirects (system paths, unsafe targets, loops and long chains are refused) and applies them to website requests through a 60-second cache.
- `PATCH /leads/:id` now accepts `next_follow_up_at` and `last_contacted_at`. Moving a lead to "contacted" records the contact date.
- `GET /leads` gains sorting, follow-up filters, a date range, assigned names and industry.

## 4. Screens redesigned

| Group | Screens |
|---|---|
| Sign-in | Login |
| Workspace | Overview, Business analytics, Activity centre, Notifications |
| Leads | All leads, Consultation requests, Contact enquiries, Pipeline, Follow-ups, Lead workspace |
| Assessments | Completed assessments, Result detail, Reports, Assessment analytics, Templates, Builder, Question bank, Categories, Scoring, Rules |
| Website | Pages, Homepage, Services, Page editor, Articles, Article editor, Media library, Navigation & footer (site settings document) |
| Marketing & SEO | SEO overview, URL redirects, Localization |
| Administration | Users, Roles & permissions, Security centre, Audit log, Email delivery, Website settings, Privacy & retention, System health |
| Support | Administrator guide, My account |

## 5. Tests performed (all actually run)

- **Backend:** `npm test` in `backend/`, 33 tests, all passing:
  - reporting periods and custom ranges;
  - dashboard counts and zero denominators;
  - permission filtering of activity and search;
  - CSRF;
  - pipeline, bulk updates and their audit entries;
  - follow-up validation, timeline and attention items;
  - sorting;
  - notifications read state and preferences;
  - preference validation;
  - security-centre scoping;
  - session revocation permissions;
  - health checks with no secrets in the output;
  - redirect validation, enforcement and loop refusal;
  - word-based search;
  - two-factor requirement, lockout counting, role enforcement and sign-out;
  - full assessment submission (scoring, encryption, idempotency, reproducibility);
  - bot protection;
  - content save, revisions, unsafe links and editor/viewer rights.

  The earlier backend test files were not in the project folder when this work started, so this suite was written fresh.
- **Browser sweep** (Playwright, production build, `docs/admin-review/qa-report.json`):
  - Coverage: 34 screens × 3 widths (1440, 768, 390) × 2 themes, giving 204 combinations.
  - Final round: 0 horizontal overflow, 0 console errors and 0 axe violations (WCAG 2.0/2.1/2.2 A and AA) on all 68 desktop screen and theme combinations.
  - Login is captured in both themes at 1440 and 390.
- **Interaction checks** (`interact.js`): 17 of 17 pass:
  - ⌘K/Ctrl K palette opens, navigates, searches leads on the server and closes with Escape;
  - a pipeline card moves with its arrow button and the change persists;
  - the sidebar collapses to 72 px and stays collapsed after reload;
  - the theme switch applies dark mode and is saved to the account;
  - selecting rows shows the bulk bar;
  - the notification popover opens;
  - a redirect created in the UI works on the website;
  - delete uses the confirm dialog;
  - the mobile drawer opens and closes on navigation;
  - no page errors.
- **Type and lint:** `tsc --noEmit` and `eslint src/components/admin` are clean. The backend compiles with `tsc`.

### Issues found and fixed during review

| Round | Issue | Fix |
|---|---|---|
| 1 | Lead list crashed when no sort was chosen (`aria-sort` read `null.dir`) | Guarded the sort lookup |
| 1 | Hydration warning on `<html>` from the pre-paint theme script | `suppressHydrationWarning` on `<html>` only |
| 1 | Demo results were incomplete, so the result page crashed | Fixtures now use the real scoring engine; the result page tolerates missing sections |
| 2 | axe: logo, search and notification buttons had accessible names that did not match their visible text | Names now come from visible text plus screen-reader text |
| 2 | axe: the scrollable sign-in event list was not keyboard-focusable | Made it focusable with a label |
| 2 | Maturity gaps wrapped into a thin column; quick-action tiles were cramped | Gaps and services moved below the chart; quick actions became a full-width row |
| 3 | Horizontal scroll on phones: overview cards, article editor fieldsets, pipeline | Cards and fieldsets get `min-w-0`; single-column editor grid; scroll containers made `relative` so screen-reader-only text cannot escape them |
| 3 | Notification badge "9+" did not match its label | Badge hidden from assistive technology |
| 4 | Palette search "demo energy" found nothing | Search matches every word in any order (server and client) |
| 4 | Routine sign-ins flooded Recent activity | Successful sign-ins now appear only in the Security centre |

## 6. Known limitations and remaining functionality

- **Publishing is immediate.** Saving publishes; there are no separate drafts, scheduled publishing or review workflow for pages. Articles have a draft/published status. Every save is kept as a revision and can be restored. System health reports scheduled publishing as "Not available".
- **No free-form page builder.** Sections cannot be reordered, hidden or duplicated per page. This keeps the public design intact, as the earlier brief required. Lists inside sections can be added to, reordered and removed. The editor offers section navigation, collapsible sections, image picking and a live preview at desktop, tablet and mobile widths.
- **Text formatting is limited.** It is structured text with `[link](/page)` and `**bold**`, plus heading, paragraph and list blocks for articles. Tables, code blocks, embeds and captions are not supported, which avoids storing HTML.
- **Media replacement is not implemented.** Upload a new image and choose it on the page instead. Deleting an image that is in use is blocked.
- **Collections not modelled separately:** testimonials, case studies, team, FAQs as their own list, navigation menus as their own screen, and email template editing. FAQs, the founder profile and the header/footer are edited inside their page documents. The navigation does not show these as separate items, so there are no empty screens.
- **External data is not connected:** website traffic, Google Search Console and backups. The screens say so and show no estimates.
- **"Invite user"** creates the account with a temporary password; no invitation email is sent.
- **Cross-browser testing:** Chromium only. Safari and Firefox were not tested in this session.
- **Large datasets:** leads are filtered after decryption on the server (up to 5,000 rows) because names are encrypted at rest. This suits a consultancy's volume; beyond tens of thousands of leads a different search index would be needed.
- **Dutch translations** of the site remain a draft for native-speaker review (Localization screen).

## 7. Running and reviewing locally

```bash
node server.js --dev                          # or double-click start-admin-preview.command on the Mac
node backend/scripts/dev-fixtures.js          # optional: clearly labelled demo data ("(demo)" companies), local databases only
node backend/scripts/dev-fixtures.js --remove # remove the demo data again
cd backend && npm test                        # backend tests (needs a bk_test MySQL database)
```

The demo fixture script refuses to run in production or against a database whose name does not contain dev, local, test or preview.
