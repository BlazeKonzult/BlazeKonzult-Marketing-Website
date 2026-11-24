/**
 * Website content: default values and the registry of editable documents.
 * Every document can be edited in the admin (Website section). What is saved there replaces these
 * defaults; anything not yet saved, or any page when the database is unreachable, falls back to them.
 * Inline text may use [link text](/path) and **bold**.
 */
import { articles as baseArticles, challenges, companyInfo, credentials, differentiators, frameworks, homeFaqs, industries as baseIndustries, mainNav, methodology, serviceGroups, services } from "@/lib/data";
import { serviceContent } from "@/lib/serviceContent";
import { articleContent, type ArticleBlock } from "@/lib/articleContent";
import { nlDefaultsFor } from "./nl";
import type { Loc } from "@/lib/locale";

export type Seo = { title: string; description: string; image?: string };
export type Cta = { label: string; href: string };
export type Closing = { title: string; body: string; primary: Cta; secondary: Cta };
export type Section = { eyebrow: string; title: string; lead: string };

const cta = (label: string, href: string): Cta => ({ label, href });
const closing = (title: string, body: string, primary = cta("Book a Consultation", "/contact"), secondary = cta("Take the readiness assessment", "/cybersecurity-assessment/")): Closing => ({ title, body, primary, secondary });
const sec = (eyebrow: string, title: string, lead = ""): Section => ({ eyebrow, title, lead });

/* --------------------------------- Site --------------------------------- */
export const siteDefaults = {
  company: { ...companyInfo, founderTitle: "Founder and principal consultant", founderPhoto: "/images/adeiza-johnson-yisa.jpg", founderPhotoAlt: "Adeiza Johnson Yisa, founder of BlazeKonzult" },
  seo: {
    defaultTitle: "BlazeKonzult | Cybersecurity Consulting for Dutch SMEs",
    titleSuffix: "BlazeKonzult",
    description: "BlazeKonzult provides practical cybersecurity guidance for Dutch SMEs — health checks, NIS2 readiness, virtual CISO support, awareness training and incident response readiness.",
    keywords: "cybersecurity services Netherlands, cybersecurity for SMEs Netherlands, NIS2 readiness Netherlands, virtual CISO Netherlands, cybersecurity health check",
    socialImage: "",
  },
  header: { nav: mainNav, ctaLabel: "Book a Consultation", ctaHref: "/contact" },
  footer: {
    blurb: "Practical, senior-led cybersecurity consulting for small and medium-sized businesses in the Netherlands.",
    resourceLinks: [cta("Readiness assessment", "/cybersecurity-assessment/"), cta("Insights", "/resources"), cta("Checklists", "/resources#checklists"), cta("Responsible disclosure", "/responsible-disclosure")],
    companyLinks: [cta("About", "/about"), cta("Contact", "/contact"), cta("Book a consultation", "/contact")],
    legalLinks: [cta("Privacy policy", "/privacy-policy"), cta("Cookies", "/cookie-policy")],
    copyright: "BlazeKonzult. All rights reserved.",
  },
  credentials,
  frameworks,
  methodology,
  serviceGroups: serviceGroups.map((g) => ({ label: g.label, description: g.description, slugs: [...g.slugs] })),
};

/* --------------------------------- Home --------------------------------- */
export const homeDefaults = {
  seo: { title: "BlazeKonzult | Cyber Resilience. Business Confidence.", description: "Senior-led cybersecurity consulting for Dutch SMEs: Cybersecurity Health Checks, NIS2 and Dutch Cybersecurity Act readiness, Virtual CISO support, awareness training and incident response readiness." },
  hero: {
    eyebrow: "Cybersecurity consulting · The Netherlands",
    titleLine1: "Cyber Resilience.",
    titleLine2: "Business Confidence.",
    lead: "Protect your business, navigate evolving cybersecurity regulations and build a stronger security foundation with expert guidance tailored to your organisation.",
    primary: cta("Book a Free Consultation", "/contact"),
    secondary: cta("Assess Your Cyber Readiness", "/cybersecurity-assessment/"),
    credentialsLabel: "Founder credentials",
    frameworksLabel: "We help you navigate",
  },
  challenges: { ...sec("Why it matters", "Cyber risk is now a business risk.", "The same pressures that large enterprises manage with dedicated teams now reach organisations of every size, usually without the people to handle them."), link: cta("See where your organisation stands", "/cybersecurity-assessment/"), items: challenges },
  services: {
    ...sec("Services", "Senior expertise, sized to your organisation.", "Start with clarity, prepare for regulation, then build lasting resilience with ongoing leadership and support."),
    link: cta("Compare all services", "/services"),
    featuredLabel: "Recommended starting point", featuredLinkLabel: "Explore the Health Check",
    regulationLabel: "Regulation · NIS2 / Cbw", regulationDate: "15.08.2026", regulationDateLabel: "Dutch Cybersecurity Act in force", regulationLinkLabel: "Prepare for NIS2",
  },
  assessment: {
    ...sec("Free self-assessment", "How prepared is your business for today's cyber threats?", "Discover your organisation's cybersecurity strengths, identify potential gaps and receive practical recommendations in minutes."),
    stats: [{ value: "5", label: "assessments" }, { value: "7", label: "domains" }, { value: "5–12", label: "minutes" }],
    button: cta("Start Your Free Assessment", "/cybersecurity-assessment/"),
    note: "No sign-up required. See your results instantly, without leaving contact details.",
  },
  why: { eyebrow: "Why BlazeKonzult", title: "Enterprise-grade thinking, scaled for growing businesses.", promise: "Clear advice. Practical action. Stronger resilience.", promiseLabel: "The BlazeKonzult brand promise", items: differentiators },
  method: sec("How we work", "A consulting method built around decisions, not documents.", "Every engagement follows the same five stages, so you always know where you are and what comes next."),
  industries: { ...sec("Industries", "The same threats land differently in every sector.", "What a business depends on decides where cyber risk concentrates. Choose a sector to see what changes."), link: cta("All industries", "/industries") },
  leadership: {
    eyebrow: "Leadership", title: "Adeiza Johnson Yisa", lead: "Founder and principal consultant",
    paragraphs: [
      "Adeiza founded BlazeKonzult to give smaller organisations access to the cybersecurity expertise usually reserved for large enterprises. His background spans cybersecurity governance, IT and OT risk, cloud security, third-party risk and executive-level cyber-risk reporting.",
      "He works directly with business leaders, translating technical risk into clear decisions and practical priorities.",
    ],
    primary: cta("Read the full profile", "/about"), linkedinLabel: "Connect on LinkedIn",
  },
  insights: { eyebrow: "Insights", title: "Practical guidance for business leaders.", link: cta("All insights", "/resources"), featuredLabel: "Regulatory update" },
  faq: { eyebrow: "FAQ", title: "Questions business leaders ask us.", note: "Something else on your mind? [Ask us directly](/contact).", items: homeFaqs.slice(0, 6) },
  closing: closing("Build a More Secure Business.", "Take the next step towards stronger cybersecurity, greater resilience and regulatory readiness.", cta("Book a Consultation", "/contact"), cta("Contact Our Team", "/contact#enquiry")),
};

/* --------------------------------- About -------------------------------- */
export const aboutDefaults = {
  seo: { title: "About BlazeKonzult and Founder Adeiza Johnson Yisa", description: "BlazeKonzult makes senior cybersecurity expertise accessible to Dutch SMEs. Meet founder Adeiza Johnson Yisa, CISSP, CISM, CCSP, CEH and PMP." },
  hero: { eyebrow: "About BlazeKonzult", title: "Enterprise cybersecurity experience, made accessible.", description: "BlazeKonzult helps Dutch MSMEs reduce cyber risk, strengthen resilience and meet growing client, regulatory and supply-chain expectations through practical, senior-led consulting." },
  founder: {
    eyebrow: "Founder", title: "A senior adviser who speaks the language of the business.",
    paragraphs: [
      "Adeiza Johnson Yisa founded BlazeKonzult to help smaller organisations access cybersecurity expertise that is often available only to large enterprises. His professional background spans cybersecurity governance, IT and OT risk, information-risk management, cloud security, third-party risk, security awareness, incident preparedness and executive-level cyber-risk reporting.",
      "He has advised business leaders, technology teams and risk owners on cyber threats, security controls, regulatory expectations, risk acceptance and resilience planning. His approach is practical and business-aligned: helping organisations understand their real risks, prioritise the controls that matter most and build confidence with customers, suppliers and regulators.",
    ],
    quote: "Cybersecurity should give business leaders clarity and confidence, not more complexity.",
    certificationsLabel: "Professional certifications",
    expertiseLabel: "Areas of expertise",
    expertise: ["Cybersecurity governance", "IT and OT risk", "Information-risk management", "Cloud security", "Third-party risk", "Security awareness", "Incident preparedness", "Executive cyber-risk reporting"],
  },
  statements: {
    eyebrow: "What drives us", title: "Clear advice. Practical action. Stronger resilience.",
    items: [
      { label: "Mission", text: "To make professional cybersecurity accessible, practical and affordable for Dutch MSMEs, helping them protect their data, operations, customers and reputation." },
      { label: "Vision", text: "To be a trusted cybersecurity partner for Dutch MSMEs, enabling smaller organisations to operate confidently in a digital economy where cyber resilience is essential to continuity and growth." },
      { label: "Purpose", text: "To translate enterprise-grade cybersecurity experience into clear, actionable and proportionate improvements for smaller businesses." },
    ],
  },
  values: {
    eyebrow: "Values", title: "How we choose to work.",
    items: [
      { title: "Clarity over complexity", text: "Guidance should be understandable, not intimidating." },
      { title: "Practical over theoretical", text: "Every recommendation is grounded in what your business can realistically act on." },
      { title: "Partnership over transactions", text: "A long-term adviser, not a one-off vendor." },
    ],
  },
  approach: { eyebrow: "Approach", title: "Every engagement follows five stages.", button: cta("Schedule a conversation", "/contact") },
  closing: closing("Talk to Adeiza about your organisation.", "A short, no-obligation consultation is the quickest way to see where to start."),
};

/* ------------------------------- Services ------------------------------- */
export const servicesPageDefaults = {
  seo: { title: "Cybersecurity Services for Dutch SMEs", description: "BlazeKonzult's cybersecurity services: Health Checks, NIS2 readiness, Virtual CISO, Managed Security Essentials, awareness training, incident response readiness and supplier assurance." },
  hero: { eyebrow: "Services", title: "Cybersecurity services for growing Dutch businesses.", description: "Every engagement is scoped around your organisation, not a generic checklist. Services are grouped by what they help you achieve.", primary: cta("Book a Consultation", "/contact"), secondary: cta("Not sure? Take the assessment", "/cybersecurity-assessment/") },
  compare: { eyebrow: "Compare", title: "Which service fits where you are today?", serviceLabel: "Service", bestForLabel: "Best suited for", outcomeLabel: "Outcome" },
  closing: closing("Not sure where to begin?", "Most organisations start with a Cybersecurity Health Check, or a free self-assessment to see where the gaps are."),
};

export const SERVICE_SLUGS = services.map((s) => s.slug);
export function serviceDefaults(slug: string) {
  const card = services.find((s) => s.slug === slug)!;
  const page = serviceContent.find((s) => s.slug === slug)!;
  const { slug: _s, href: _h, ...cardFields } = card;
  const { slug: _p, metaTitle, metaDescription, ...pageFields } = page;
  return { card: cardFields, seo: { title: metaTitle, description: metaDescription }, ...pageFields };
}

/* ------------------------------ Industries ------------------------------ */
export const industriesDefaults = {
  seo: { title: "Cybersecurity by Industry", description: "How cyber risk differs across professional services, healthcare, manufacturing, logistics, SaaS, IT service providers and suppliers to regulated organisations in the Netherlands." },
  hero: { eyebrow: "Industries", title: "Cyber risk follows what your business depends on.", description: "A law firm's exposure sits in its inbox; a manufacturer's on the production floor. These profiles show where risk concentrates in each sector, and what we prioritise first." },
  labels: { dependsOn: "Depends on:", risks: "Where risk concentrates", priorities: "What we prioritise", regulatory: "Regulatory note.", services: "Relevant services" },
  notListed: { text: "Your sector is not listed, or your business spans several?", button: cta("Tell us about your organisation", "/contact") },
  closing: closing("Get advice that fits your sector.", "Book a consultation and we will start from what your business depends on."),
  items: baseIndustries,
};

/* ------------------------------- Insights ------------------------------- */
export const resourcesDefaults = {
  seo: { title: "Cybersecurity Insights", description: "Practical cybersecurity guidance for Dutch SMEs — articles on NIS2 readiness, phishing awareness, Microsoft 365 security, incident readiness and more." },
  hero: { eyebrow: "Insights", title: "Practical cybersecurity guidance for business leaders.", description: "Clear, jargon-free articles on regulation, risk and resilience, written for the people who make decisions in Dutch SMEs." },
  featuredSlug: "",
  featuredLabel: "Featured · Regulatory update",
  checklists: {
    ...sec("Checklists", "Free practical checklists.", "Request a checklist and we will send it to your inbox."),
    items: [
      { name: "Cyber Resilience Checklist", title: "Cyber Resilience Checklist for Dutch SMEs", text: "The essential controls every growing business should have in place.", buttonLabel: "Request the Free Checklist" },
      { name: "NIS2 Supplier Readiness Checklist", title: "NIS2 Supplier Readiness Checklist", text: "What suppliers should prepare as customers respond to NIS2 and the Dutch Cybersecurity Act.", buttonLabel: "Request the Supplier Checklist" },
    ],
  },
  newsletter: { title: "Get new insights by email.", text: "Occasional, practical guidance. No spam, unsubscribe at any time." },
  article: {
    nextStepLabel: "Next step", nextStepTitle: "See where your organisation stands.", nextStepText: "The free readiness assessment takes about five to ten minutes.", nextStepLink: cta("Start the assessment", "/cybersecurity-assessment/"),
    backLabel: "All insights", relatedEyebrow: "Continue reading", relatedTitle: "Related insights",
    closing: closing("Want tailored guidance?", "A Cybersecurity Health Check gives you a clear view of your priority risks and a practical plan."),
  },
};

export type ArticleDoc = {
  title: string; category: string; excerpt: string; date: string; readTime: string; author: string;
  status: "published" | "draft"; coverImage: string; coverAlt: string; seo: Seo; body: ArticleBlock[];
};
export const defaultArticleSlugs = baseArticles.map((a) => a.slug);
export function articleDefaults(slug: string): ArticleDoc | null {
  const a = baseArticles.find((x) => x.slug === slug);
  if (!a) return null;
  return { title: a.title, category: a.category, excerpt: a.excerpt, date: a.date, readTime: a.readTime, author: "Adeiza Johnson Yisa", status: "published", coverImage: "", coverAlt: "", seo: { title: "", description: "" }, body: articleContent[slug] ?? [] };
}
export const newArticle = (): ArticleDoc => ({ title: "", category: "Cyber Resilience", excerpt: "", date: new Date().toISOString().slice(0, 10), readTime: "5 min read", author: "Adeiza Johnson Yisa", status: "draft", coverImage: "", coverAlt: "", seo: { title: "", description: "" }, body: [{ p: "" }] });

/* -------------------------------- Contact ------------------------------- */
export const contactDefaults = {
  seo: { title: "Contact and Book a Consultation", description: "Book a free consultation with BlazeKonzult, request a Cybersecurity Health Check, or discuss NIS2 readiness and Virtual CISO support." },
  hero: { eyebrow: "Book a consultation", title: "Let's talk about your organisation's cybersecurity.", description: "Tell us a little about your organisation and what prompted you to get in touch. We will come back to you, usually within one business day." },
  form: { title: "Your enquiry", note: "Fields marked * are required." },
  next: {
    title: "What happens next",
    items: [
      { title: "We reply within one business day", text: "A senior consultant reads every enquiry personally." },
      { title: "A short consultation", text: "We discuss your situation and what would genuinely help, with no obligation." },
      { title: "A clear proposal", text: "If there is a fit, you receive a scoped proposal with timelines." },
    ],
  },
  linkedinLabel: "Message Adeiza on LinkedIn",
  assessmentBox: { eyebrow: "Not ready to talk yet?", text: "Take the free readiness assessment and see where your organisation stands first.", link: cta("Start the assessment", "/cybersecurity-assessment/") },
  privacyNote: "Your details are used only to respond to your enquiry, as described in our [Privacy Policy](/privacy-policy). We never sell or share your data for marketing.",
};

/* --------------------------------- Legal -------------------------------- */
export type LegalDoc = { seo: Seo; title: string; intro: string; notice: string; sections: { heading: string; paragraphs: string[]; bullets: string[] }[] };
const s = (heading: string, paragraphs: string[], bullets: string[] = []) => ({ heading, paragraphs, bullets });

export const privacyDefaults: LegalDoc = {
  seo: { title: "Privacy Policy", description: "How BlazeKonzult collects, uses and protects personal data, in line with the GDPR." },
  title: "Privacy Policy", intro: "Last updated: 24 November 2026", notice: "",
  sections: [
    s("1. Who we are", ["BlazeKonzult (“we”, “us”) is a cybersecurity consultancy founded by Adeiza Johnson Yisa, serving businesses in the Netherlands. We are the data controller for personal data collected through this website."]),
    s("2. What data we collect", ["We only collect the information you choose to give us through the forms on this website: your name, company, business email address and, if you provide them, your phone number, job title, company size, sector, the support you are interested in and the content of your message. For newsletter sign-ups we collect only your email address. We do not use analytics, advertising or tracking tools."]),
    s("3. The cybersecurity readiness assessment", [
      "You can complete the assessment and see your results without giving any contact details. Your answers are used only to calculate your results. They are stored encrypted, together with general profile answers such as company size, sector and country, which we use in aggregated form to improve the assessment. We never ask for passwords, IP addresses, network diagrams or other sensitive technical details.",
      "While you are answering, your progress is saved only in your own browser (local storage) so you can continue later. It is removed when you submit.",
      "If you request the PDF report or a consultation, we store the contact details you provide, linked to your results, so we can send the report and prepare for the conversation. Report download links are personal and expire after 14 days. Marketing emails are only sent if you separately agree to them.",
      "Anonymous assessment results are deleted after 12 months. Contact details from assessment and website enquiries are deleted after 24 months unless you become a client. You can ask us at any time for a copy of your data or for it to be deleted.",
    ]),
    s("4. How and why we use your data", ["We use your data to respond to your enquiry, to send you a report or checklist you have requested and, if you have signed up or consented, to send you occasional cybersecurity guidance. The legal basis is your consent and, where you ask us about our services, the steps needed before entering into an agreement with you (GDPR Article 6(1)(a) and (b)). We never sell your data or share it for marketing purposes."]),
    s("5. Where your data is processed", ["Data is processed and stored by our website hosting provider in the European Union. Contact details and assessment answers are encrypted in our database. Our hosting and email providers act on our behalf and only process your data to provide their service to us."]),
    s("6. Your rights", ["Under the GDPR you have the right to access, correct or delete your personal data, to restrict or object to its processing, to data portability, and to withdraw your consent at any time. To exercise any of these rights, contact us through our [contact page](/contact/). You also have the right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens)."]),
    s("7. Data security", ["We apply appropriate technical and organisational measures to protect personal data, including encrypted (HTTPS) connections, encryption of stored contact details and assessment answers, spam protection on forms, and restricted, logged access to our administration system."]),
    s("8. Contact us", ["For any privacy-related questions, please get in touch through our [contact page](/contact/)."]),
  ],
};

export const cookieDefaults: LegalDoc = {
  seo: { title: "Cookie Policy", description: "How BlazeKonzult uses cookies and similar technologies on this website." },
  title: "Cookie Policy", intro: "Last updated: 24 November 2026", notice: "",
  sections: [
    s("1. What are cookies", ["Cookies are small text files that a website places on your device. They are often used to remember preferences or to track how visitors use a site."]),
    s("2. Cookies on this website", ["This website does not use cookies for visitors. We do not use analytics, advertising or tracking tools, and we do not load content from social media platforms that would set their own cookies. The only cookie we use is a strictly necessary sign-in cookie for our own staff on the administration pages."]),
    s("3. Local storage", ["When you take the readiness assessment, your progress is saved in your browser's local storage so you can continue where you left off. It never leaves your device until you submit, and it is removed afterwards."]),
    s("4. Fonts and third-party content", ["All fonts and images on this website are served from our own web server, so visiting the site does not send your data to font or content providers. Links to LinkedIn open LinkedIn's own website, which is governed by LinkedIn's cookie policy."]),
    s("5. Changes to this policy", ["If we introduce cookies or analytics in the future, we will update this policy and, where required, ask for your consent before any non-essential cookies are set."]),
    s("6. Contact us", ["Questions about this policy can be sent through our [contact page](/contact/)."]),
  ],
};

export const disclosureDefaults: LegalDoc = {
  seo: { title: "Responsible Disclosure", description: "How to report a security vulnerability in BlazeKonzult's website or systems." },
  title: "Responsible Disclosure",
  intro: "As a cybersecurity organisation, we take the security of our own systems seriously and welcome responsible reports from the security community.",
  notice: "If you believe you have discovered a security vulnerability in our website or systems, we ask that you report it to us responsibly, in line with the guidance below.",
  sections: [
    s("What we ask", [], ["Report the issue promptly and privately, without publicly disclosing it first.", "Provide enough detail for us to reproduce and understand the issue.", "Avoid accessing, modifying or deleting data that does not belong to you.", "Do not perform testing that could disrupt our services or affect other users."]),
    s("How to report", ["Please send reports through our [contact page](/contact/) with as much detail as possible."]),
    s("What you can expect from us", ["We aim to acknowledge reports promptly, investigate in good faith, and keep you informed of progress until the issue is resolved."]),
  ],
};

/* ------------------------------- Registry ------------------------------- */
export type DocInfo = { key: string; label: string; group: "Site" | "Pages" | "Services" | "Legal"; path: string; defaults: () => unknown };
export const REGISTRY: DocInfo[] = [
  { key: "site", label: "Site settings, header, footer & shared lists", group: "Site", path: "/", defaults: () => siteDefaults },
  { key: "page:home", label: "Home", group: "Pages", path: "/", defaults: () => homeDefaults },
  { key: "page:about", label: "About", group: "Pages", path: "/about", defaults: () => aboutDefaults },
  { key: "page:services", label: "Services overview", group: "Pages", path: "/services", defaults: () => servicesPageDefaults },
  { key: "page:industries", label: "Industries", group: "Pages", path: "/industries", defaults: () => industriesDefaults },
  { key: "page:resources", label: "Insights page (and article page labels)", group: "Pages", path: "/resources", defaults: () => resourcesDefaults },
  { key: "page:contact", label: "Contact", group: "Pages", path: "/contact", defaults: () => contactDefaults },
  ...services.map((sv): DocInfo => ({ key: `service:${sv.slug}`, label: sv.name, group: "Services", path: sv.href, defaults: () => serviceDefaults(sv.slug) })),
  { key: "page:privacy-policy", label: "Privacy policy", group: "Legal", path: "/privacy-policy", defaults: () => privacyDefaults },
  { key: "page:cookie-policy", label: "Cookie policy", group: "Legal", path: "/cookie-policy", defaults: () => cookieDefaults },
  { key: "page:responsible-disclosure", label: "Responsible disclosure", group: "Legal", path: "/responsible-disclosure", defaults: () => disclosureDefaults },
];
export const registryByKey = (key: string) => REGISTRY.find((d) => d.key === key);

/** Default value for any editable key, including articles. Dutch falls back to English where no translation exists. */
export function defaultsFor(key: string, loc: Loc = "en"): unknown {
  if (loc === "nl" && !key.startsWith("article:")) { const nl = nlDefaultsFor(key); if (nl) return nl; }
  if (key.startsWith("article:")) return articleDefaults(key.slice(8));
  return registryByKey(key)?.defaults() ?? null;
}

/** Content key as stored: Dutch documents are kept under "nl:<key>". */
export const storeKey = (key: string, loc: Loc) => (loc === "nl" ? `nl:${key}` : key);

export type SiteDoc = typeof siteDefaults;
export type HomeDoc = typeof homeDefaults;
export type AboutDoc = typeof aboutDefaults;
export type ServicesPageDoc = typeof servicesPageDefaults;
export type ServiceDoc = ReturnType<typeof serviceDefaults>;
export type IndustriesDoc = typeof industriesDefaults;
export type ResourcesDoc = typeof resourcesDefaults;
export type ContactDoc = typeof contactDefaults;
