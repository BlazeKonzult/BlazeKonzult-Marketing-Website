// Shared content data for BlazeKonzult website.

export type NavLink = { label: string; href: string };

export const mainNav: NavLink[] = [
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Insights", href: "/resources" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const companyInfo = {
  name: "BlazeKonzult",
  founder: "Adeiza Johnson Yisa",
  tagline: "Clear advice. Practical action. Stronger resilience.",
  supportingMessage: "Practical cybersecurity for Dutch SMEs and growing businesses.",
  linkedin: "https://www.linkedin.com/in/dazzy",
  serviceArea: "The Netherlands, with remote support available across the EU",
};

export type Service = {
  slug: string;
  category: "Assess" | "Prepare" | "Govern" | "Educate" | "Respond" | "Improve";
  name: string;
  shortDescription: string;
  bestSuitedFor: string;
  deliverables: string[];
  outcome: string;
  href: string;
  icon: string; // lucide-react icon name
};

export const services: Service[] = [
  {
    slug: "cybersecurity-health-check",
    category: "Assess",
    name: "Cybersecurity Health Check",
    shortDescription:
      "A fixed-scope review of your organisation's current cybersecurity posture, priority risks and recommended improvements.",
    bestSuitedFor: "Organisations that are unsure where their cybersecurity currently stands.",
    deliverables: [
      "Baseline maturity review",
      "Risk summary",
      "Executive report",
      "Prioritised 90-day action plan",
    ],
    outcome: "A clear, practical starting point for improving cyber resilience.",
    href: "/cybersecurity-health-check",
    icon: "SearchCheck",
  },
  {
    slug: "nis2-readiness",
    category: "Prepare",
    name: "NIS2 Readiness",
    shortDescription:
      "Support to help organisations and suppliers understand potential NIS2 and Dutch Cybersecurity Act expectations.",
    bestSuitedFor: "Organisations and suppliers who may fall within scope of NIS2 or related supply-chain requirements.",
    deliverables: [
      "Applicability screening",
      "Gap assessment",
      "Governance recommendations",
      "Supplier-readiness checklist",
    ],
    outcome: "Greater clarity on potential obligations and a practical path toward readiness.",
    href: "/nis2-readiness",
    icon: "ClipboardCheck",
  },
  {
    slug: "virtual-ciso",
    category: "Govern",
    name: "Virtual CISO",
    shortDescription:
      "Part-time senior cybersecurity leadership without the cost of hiring a full-time CISO.",
    bestSuitedFor: "Growing businesses that need senior cybersecurity guidance but are not ready for a full-time hire.",
    deliverables: [
      "Risk register",
      "Policy guidance",
      "Management reporting",
      "Strategic cybersecurity roadmap",
    ],
    outcome: "Ongoing senior-level direction and accountability for cybersecurity decisions.",
    href: "/virtual-ciso",
    icon: "UserCheck",
  },
  {
    slug: "managed-security",
    category: "Improve",
    name: "Managed Security Essentials",
    shortDescription: "Ongoing cybersecurity oversight and improvement coordination.",
    bestSuitedFor: "Businesses that want continuous attention to security without building an internal team.",
    deliverables: [
      "Monthly security review",
      "Improvement tracker",
      "Vulnerability follow-up",
      "Cloud security review coordination",
    ],
    outcome: "Steady, measurable progress on your cybersecurity improvement plan.",
    href: "/managed-security",
    icon: "ShieldCheck",
  },
  {
    slug: "security-awareness-training",
    category: "Educate",
    name: "Security Awareness Training",
    shortDescription:
      "Practical training that helps employees recognise phishing, social engineering and business email compromise.",
    bestSuitedFor: "Teams of any size who are often the first line of defence against cyber threats.",
    deliverables: [
      "Employee training session",
      "Phishing simulation",
      "Awareness metrics",
      "Coaching recommendations",
    ],
    outcome: "A more alert, confident workforce that recognises and reports suspicious activity.",
    href: "/security-awareness-training",
    icon: "GraduationCap",
  },
  {
    slug: "incident-response-readiness",
    category: "Respond",
    name: "Incident Response Readiness",
    shortDescription:
      "Preparation for ransomware, data breaches, account compromise and business disruption.",
    bestSuitedFor: "Organisations that want to respond with confidence, not confusion, if something goes wrong.",
    deliverables: [
      "Incident-response plan",
      "Tabletop exercise",
      "Backup and recovery review",
      "Escalation checklist",
    ],
    outcome: "A tested plan and a calmer, faster response when it matters most.",
    href: "/incident-response-readiness",
    icon: "LifeBuoy",
  },
  {
    slug: "supplier-security-assurance",
    category: "Assess",
    name: "Supplier Security Assurance",
    shortDescription:
      "Help smaller businesses respond to customer security questionnaires and demonstrate cybersecurity maturity.",
    bestSuitedFor: "Suppliers and vendors who face growing security expectations from larger customers.",
    deliverables: [
      "Questionnaire support",
      "Evidence preparation",
      "Control-gap identification",
      "Remediation roadmap",
    ],
    outcome: "Faster, more confident responses to customer and partner security requirements.",
    href: "/supplier-security-assurance",
    icon: "FileCheck2",
  },
];





export const homeFaqs = [
  {
    question: "Do we need a full-time CISO?",
    answer:
      "Not necessarily. Many small and mid-sized organisations benefit from part-time, senior-level guidance instead of a full-time hire. A Virtual CISO gives you that leadership on a flexible basis, at a fraction of the cost.",
  },
  {
    question: "Where should we start if we have a limited budget?",
    answer:
      "A Cybersecurity Health Check is usually the most practical starting point. It gives you a clear view of your current risks and a prioritised action plan, so you can invest in what matters most first.",
  },
  {
    question: "Can BlazeKonzult help with NIS2?",
    answer:
      "Yes. We help organisations and suppliers understand whether NIS2 or related Dutch Cybersecurity Act requirements may apply to them, and guide you through practical readiness steps such as gap assessments and governance recommendations.",
  },
  {
    question: "Can BlazeKonzult provide penetration testing?",
    answer:
      "We coordinate with trusted technical specialists for penetration testing and vulnerability scanning as part of a broader assessment, and help you interpret and act on the results in business terms.",
  },
  {
    question: "Do the services include incident response?",
    answer:
      "We focus on incident response readiness — helping you prepare plans, run tabletop exercises and review backups so your team can respond with confidence if an incident occurs.",
  },
  {
    question: "Is the service suitable for non-technical business owners?",
    answer:
      "Yes. Our approach is designed for business leaders, not just technical teams. We explain risks and recommendations in plain business language, with clear priorities and next steps.",
  },
  {
    question: "How long does a Cybersecurity Health Check take?",
    answer:
      "Most Health Checks are completed within a few weeks, depending on the size and complexity of your organisation. We agree the scope and timeline with you upfront.",
  },
  {
    question: "Can BlazeKonzult help us respond to a customer security questionnaire?",
    answer:
      "Yes. Our Supplier Security Assurance service helps you prepare evidence, answer questionnaires accurately and close any control gaps that customers may raise.",
  },
];

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
};

export const articles: Article[] = [
  {
    slug: "cybersecurity-health-check-what-dutch-smes-should-review-first",
    title: "Cybersecurity Health Check: What Dutch SMEs Should Review First",
    excerpt:
      "A practical look at the areas most Dutch SMEs should review first when assessing their cybersecurity posture.",
    category: "Assessment",
    date: "2026-10-16",
    readTime: "3 min read",
  },
  {
    slug: "nis2-and-the-dutch-cybersecurity-act-what-suppliers-should-prepare",
    title: "NIS2 and the Dutch Cybersecurity Act: What Suppliers Should Prepare",
    excerpt: "What suppliers to regulated organisations should start preparing as expectations evolve.",
    category: "NIS2 & Regulation",
    date: "2026-10-16",
    readTime: "3 min read",
  },
  {
    slug: "how-to-answer-customer-cybersecurity-questionnaires",
    title: "How to Answer Customer Cybersecurity Questionnaires",
    excerpt: "A practical approach to responding accurately and efficiently to security questionnaires.",
    category: "Supplier Assurance",
    date: "2026-10-16",
    readTime: "3 min read",
  },
  {
    slug: "microsoft-365-security-basics-for-small-businesses",
    title: "Microsoft 365 Security Basics for Small Businesses",
    excerpt: "Foundational settings and habits that meaningfully reduce risk in Microsoft 365 environments.",
    category: "Practical Guidance",
    date: "2026-10-16",
    readTime: "2 min read",
  },
  {
    slug: "ransomware-readiness-checklist-for-dutch-msmes",
    title: "Ransomware Readiness Checklist for Dutch MSMEs",
    excerpt: "Key preparations that help smaller organisations respond calmly and recover quickly.",
    category: "Incident Readiness",
    date: "2026-10-16",
    readTime: "3 min read",
  },
  {
    slug: "why-smaller-businesses-need-a-virtual-ciso",
    title: "Why Smaller Businesses Need a Virtual CISO",
    excerpt: "How part-time senior cybersecurity leadership helps growing businesses make better decisions.",
    category: "Governance",
    date: "2026-10-16",
    readTime: "2 min read",
  },
  {
    slug: "what-effective-phishing-awareness-training-looks-like",
    title: "What Effective Phishing Awareness Training Looks Like",
    excerpt: "The elements that separate genuinely effective awareness training from a checkbox exercise.",
    category: "Awareness Training",
    date: "2026-10-16",
    readTime: "3 min read",
  },
  {
    slug: "cybersecurity-for-logistics-healthtech-and-manufacturing-smes",
    title: "Cybersecurity for Logistics, Healthtech and Manufacturing SMEs",
    excerpt: "Sector-specific considerations for organisations that depend on connected operational systems.",
    category: "Sector Insights",
    date: "2026-10-16",
    readTime: "3 min read",
  },
];

/* ------------------------------------------------------------------ */
/* Service navigation groups (header mega menu, footer, overview page) */
/* ------------------------------------------------------------------ */
export const serviceGroups = [
  {
    label: "Assess and prepare",
    description: "Understand where you stand and what is expected of you.",
    slugs: ["cybersecurity-health-check", "nis2-readiness", "supplier-security-assurance"],
  },
  {
    label: "Lead and improve",
    description: "Senior direction and steady, measurable progress.",
    slugs: ["virtual-ciso", "managed-security"],
  },
  {
    label: "Protect and respond",
    description: "Prepare your people and your plan for a bad day.",
    slugs: ["security-awareness-training", "incident-response-readiness"],
  },
] as const;

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug)!;

/* ---------------------------- Credentials ---------------------------- */
// Verified professional certifications held by the founder.
export const credentials = [
  { code: "CISSP", name: "Certified Information Systems Security Professional" },
  { code: "CISM", name: "Certified Information Security Manager" },
  { code: "CCSP", name: "Certified Cloud Security Professional" },
  { code: "CEH", name: "Certified Ethical Hacker" },
  { code: "PMP", name: "Project Management Professional" },
];

// Regulations and frameworks the consultancy helps clients navigate (topics, not certifications).
export const frameworks = ["NIS2 / Cyberbeveiligingswet", "GDPR / AVG", "ISO/IEC 27001", "NEN 7510", "CIS Controls"];

/* ------------------------- Business challenges ------------------------ */
export const challenges = [
  {
    title: "Threats that target smaller firms",
    description:
      "Phishing, account takeover, invoice fraud and ransomware are aimed squarely at organisations without a dedicated security team.",
    icon: "Crosshair",
  },
  {
    title: "Regulation that keeps moving",
    description:
      "NIS2 and the Dutch Cybersecurity Act, GDPR and sector rules raise the bar for governance, reporting and evidence.",
    icon: "Scale",
  },
  {
    title: "No senior security expertise in-house",
    description:
      "Important security decisions fall to IT generalists or busy directors who lack the time or background to weigh the risk.",
    icon: "UserX",
  },
  {
    title: "Disruption to day-to-day operations",
    description:
      "A single compromised mailbox or encrypted server can stop sales, deliveries or care for days, not hours.",
    icon: "Activity",
  },
  {
    title: "Risk inherited through suppliers",
    description:
      "IT providers, cloud platforms and partners hold keys to your environment, while your own customers question you in turn.",
    icon: "Network",
  },
  {
    title: "Uncertain business continuity",
    description:
      "Backups exist but are untested, and nobody is quite sure who decides what when systems go down.",
    icon: "LifeBuoy",
  },
];

/* --------------------------- Differentiators -------------------------- */
export const differentiators = [
  {
    title: "Practical cybersecurity expertise",
    description: "Senior, certified experience across governance, cloud, IT and OT risk — applied at a scale that fits an SME.",
  },
  {
    title: "Business-focused recommendations",
    description: "Findings are framed as business risk with a clear owner, cost and priority, not a list of technical faults.",
  },
  {
    title: "Tailored engagements",
    description: "Fixed-scope assessments or ongoing support, sized to your organisation rather than a fixed package.",
  },
  {
    title: "European regulatory understanding",
    description: "Grounded in NIS2, the Dutch Cybersecurity Act and GDPR, and in what your customers will ask of you because of them.",
  },
  {
    title: "Flexible security leadership",
    description: "Virtual CISO support gives you senior direction for a few days a month instead of a full-time executive hire.",
  },
  {
    title: "Long-term risk reduction",
    description: "Every engagement ends in a prioritised roadmap you can track, so progress continues after the report is delivered.",
  },
];

/* ----------------------------- Methodology ---------------------------- */
export const methodology = [
  {
    step: "01",
    title: "Discover",
    description: "We learn how your organisation works, what it depends on and what your customers and regulators expect.",
    output: "Scope and priorities agreed",
  },
  {
    step: "02",
    title: "Assess",
    description: "We review controls, processes and suppliers against recognised good practice and your obligations.",
    output: "Evidence-based findings",
  },
  {
    step: "03",
    title: "Strategize",
    description: "Findings become a roadmap ranked by risk, cost and urgency, written for decision-makers.",
    output: "Prioritised roadmap",
  },
  {
    step: "04",
    title: "Implement",
    description: "We guide your team and IT provider through the changes, from policies to technical settings.",
    output: "Controls in place",
  },
  {
    step: "05",
    title: "Improve",
    description: "Regular reviews track progress, re-test assumptions and adjust to new threats and requirements.",
    output: "Measurable progress",
  },
];

/* ------------------------------ Industries ---------------------------- */
export type Industry = {
  slug: string;
  name: string;
  icon: string;
  summary: string;
  dependsOn: string;
  challenges: string[];
  priorities: string[];
  regulatory: string;
  services: string[];
};

export const industries: Industry[] = [
  {
    slug: "professional-services",
    name: "Professional services",
    icon: "Briefcase",
    summary:
      "Law, accounting, consulting and advisory firms hold confidential client information and move money on clients' behalf, which makes them a prime target for email fraud.",
    dependsOn: "Email, document management and client portals",
    challenges: [
      "Business email compromise and fake payment instructions",
      "Confidential client files spread across email, cloud storage and laptops",
      "Clients asking for security assurances during onboarding",
    ],
    priorities: [
      "Multi-factor authentication and mailbox monitoring",
      "Clear verification procedure for payment changes",
      "Controlled document sharing and retention",
    ],
    regulatory: "GDPR applies to almost all client data; professional confidentiality duties raise the stakes of a breach.",
    services: ["cybersecurity-health-check", "security-awareness-training", "virtual-ciso"],
  },
  {
    slug: "healthcare-healthtech",
    name: "Healthcare and healthtech",
    icon: "HeartPulse",
    summary:
      "Clinics, care providers and the software companies that serve them handle special-category health data and support processes where downtime affects people directly.",
    dependsOn: "Patient records, clinical software and connected devices",
    challenges: [
      "Health data is a special category under the GDPR",
      "Care-critical systems with little tolerance for downtime",
      "Hospitals and care groups demanding detailed supplier assurance",
    ],
    priorities: [
      "Strict access control and logging on patient data",
      "Tested recovery for care-critical systems",
      "Evidence packs aligned with NEN 7510 expectations",
    ],
    regulatory: "Healthcare is a NIS2 sector; Dutch healthcare buyers commonly reference NEN 7510 for information security.",
    services: ["nis2-readiness", "supplier-security-assurance", "incident-response-readiness"],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    icon: "Factory",
    summary:
      "Production environments increasingly connect machines to office networks and the cloud, often running older software that cannot simply be patched.",
    dependsOn: "Production lines, OT networks and machine-supplier remote access",
    challenges: [
      "Operational technology that cannot be updated like office IT",
      "Remote maintenance access held by machine suppliers",
      "An office infection spreading onto the production floor",
    ],
    priorities: [
      "Separation between office IT and production networks",
      "Controlled, logged supplier remote access",
      "Recovery plans for machine configurations and production data",
    ],
    regulatory: "Several manufacturing sub-sectors fall within NIS2 scope as important entities.",
    services: ["cybersecurity-health-check", "nis2-readiness", "incident-response-readiness"],
  },
  {
    slug: "logistics-transport",
    name: "Logistics and transport",
    icon: "Truck",
    summary:
      "Logistics businesses run on tightly connected platforms shared with shippers, carriers and customs, so an outage is felt immediately in missed deliveries.",
    dependsOn: "Transport and warehouse systems, partner data exchange",
    challenges: [
      "Invoice redirection and payment fraud across many counterparties",
      "Dependence on partner portals and integrations",
      "Operations that stop when planning systems are down",
    ],
    priorities: [
      "Strong authentication on portals and partner access",
      "Manual fallback procedures for multi-day outages",
      "Supplier and integration risk mapping",
    ],
    regulatory: "Transport is a NIS2 sector; larger shippers increasingly pass security requirements down the chain.",
    services: ["nis2-readiness", "incident-response-readiness", "supplier-security-assurance"],
  },
  {
    slug: "saas-data",
    name: "SaaS and data companies",
    icon: "Cloud",
    summary:
      "Software and data businesses sell trust as much as functionality: enterprise customers expect mature cloud security before they sign.",
    dependsOn: "Cloud infrastructure, code pipelines and customer data",
    challenges: [
      "Long security questionnaires blocking enterprise deals",
      "Cloud misconfiguration and over-privileged access",
      "Customer data spread across tools and environments",
    ],
    priorities: [
      "A reusable assurance and evidence pack",
      "Least-privilege cloud access and secrets management",
      "A credible roadmap toward ISO/IEC 27001 where customers expect it",
    ],
    regulatory: "Customer contracts and GDPR processor obligations often define the security bar before any regulation does.",
    services: ["supplier-security-assurance", "virtual-ciso", "managed-security"],
  },
  {
    slug: "it-msp",
    name: "IT and managed service providers",
    icon: "Server",
    summary:
      "Providers with administrative access to many client environments are a high-value target: one compromise can reach every customer.",
    dependsOn: "Remote management tools and privileged client access",
    challenges: [
      "Privileged access to multiple customer environments",
      "Clients and their regulators asking for evidence of controls",
      "Balancing service delivery with internal security discipline",
    ],
    priorities: [
      "Hardened remote management and privileged access",
      "Documented incident notification to clients",
      "Independent oversight of your own security posture",
    ],
    regulatory: "Managed service providers are explicitly named in NIS2 within ICT service management.",
    services: ["virtual-ciso", "nis2-readiness", "managed-security"],
  },
  {
    slug: "regulated-suppliers",
    name: "Suppliers to regulated organisations",
    icon: "Link2",
    summary:
      "Smaller firms that supply energy, healthcare, government or financial organisations inherit their customers' obligations through contracts and audits.",
    dependsOn: "Customer contracts, shared data and system connections",
    challenges: [
      "Security clauses and incident-notification duties in contracts",
      "Questionnaires and audits without in-house expertise to answer them",
      "Risk of losing tenders on security grounds",
    ],
    priorities: [
      "Fundamental controls documented and evidenced",
      "A short, tested incident notification procedure",
      "An owner for security at management level",
    ],
    regulatory: "Organisations in NIS2 scope must manage supply-chain risk, so their expectations flow down to you.",
    services: ["supplier-security-assurance", "nis2-readiness", "cybersecurity-health-check"],
  },
];
