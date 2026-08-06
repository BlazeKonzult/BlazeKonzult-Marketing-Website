// Shared content data for BlazeKonzult website.
// NOTE: Replace placeholder values marked "PLACEHOLDER" with real company
// information before launch. See /PLACEHOLDERS.md in the project root
// for a consolidated list.

export type NavLink = { label: string; href: string };

export const mainNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const companyInfo = {
  name: "BlazeKonzult",
  founder: "Adeiza Johnson Yisa",
  tagline: "Clear advice. Practical action. Stronger resilience.",
  supportingMessage: "Practical cybersecurity for Dutch SMEs and growing businesses.",
  // PLACEHOLDER: insert registered business address
  address: "Business address — PLACEHOLDER (to be added)",
  // PLACEHOLDER: insert business phone number
  phone: "+31 (0) 00 000 0000 — PLACEHOLDER",
  // PLACEHOLDER: insert business email address
  email: "hello@blazekonzult.example — PLACEHOLDER",
  // PLACEHOLDER: insert LinkedIn company page URL
  linkedin: "https://www.linkedin.com/company/blazekonzult — PLACEHOLDER",
  // PLACEHOLDER: insert scheduling tool URL (e.g. Calendly, Cal.com)
  bookingUrl: "https://cal.com/blazekonzult — PLACEHOLDER",
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
    name: "Security Awareness and Phishing Training",
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

export const credibilityItems = [
  "CISSP",
  "CISM",
  "CCSP",
  "PMP",
  "CEH",
  "Cyber Governance",
  "IT and OT Risk",
  "Incident Preparedness",
  "Executive Advisory",
];

export const problemCards = [
  {
    title: "Limited internal cybersecurity expertise",
    description:
      "Most growing businesses cannot justify a full-time cybersecurity leader, leaving important decisions without senior guidance.",
    icon: "Users",
  },
  {
    title: "Increasing customer and supplier requirements",
    description:
      "Larger customers and partners increasingly expect evidence of cybersecurity maturity before they will do business with you.",
    icon: "FileSearch",
  },
  {
    title: "Unclear NIS2 and regulatory expectations",
    description:
      "Many organisations are unsure whether new regulations may apply to them, or what readiness actually involves.",
    icon: "Scale",
  },
  {
    title: "Difficulty prioritising security investments",
    description:
      "With limited time and budget, it is hard to know which improvements will genuinely reduce risk first.",
    icon: "ListChecks",
  },
];

export const processSteps = [
  {
    step: "1",
    title: "Discover",
    description: "Discuss the organisation, business priorities and cybersecurity concerns.",
    icon: "MessageCircle",
  },
  {
    step: "2",
    title: "Assess",
    description: "Review the current security posture, risks, controls and requirements.",
    icon: "SearchCheck",
  },
  {
    step: "3",
    title: "Prioritise",
    description: "Identify the most important improvements based on risk, cost and urgency.",
    icon: "ListOrdered",
  },
  {
    step: "4",
    title: "Strengthen",
    description: "Implement a realistic cybersecurity roadmap and measure progress.",
    icon: "TrendingUp",
  },
];

export const sectors = [
  {
    name: "Professional Services",
    description: "Protecting client data, confidential records and everyday business communications.",
    icon: "Briefcase",
  },
  {
    name: "Healthcare and Healthtech",
    description: "Supporting patient-data protection and resilience of care-critical systems.",
    icon: "HeartPulse",
  },
  {
    name: "Manufacturing",
    description: "Addressing IT and OT risk across production, supply chains and connected equipment.",
    icon: "Factory",
  },
  {
    name: "SaaS and Data Companies",
    description: "Strengthening cloud security, access control and customer trust.",
    icon: "Cloud",
  },
  {
    name: "IT and Managed Service Providers",
    description: "Reinforcing the security practices that customers rely on you to uphold.",
    icon: "Server",
  },
  {
    name: "Suppliers to Regulated Organisations",
    description: "Preparing evidence and controls that satisfy larger customers' due-diligence requirements.",
    icon: "ShieldCheck",
  },
];

export const testimonialPlaceholders = [
  {
    label: "Professional Services Company",
    quote:
      "Placeholder content. A future client testimonial describing their experience working with BlazeKonzult will appear here.",
  },
  {
    label: "Logistics Supplier",
    quote:
      "Placeholder content. A future client testimonial describing their experience working with BlazeKonzult will appear here.",
  },
  {
    label: "Growing Technology Business",
    quote:
      "Placeholder content. A future client testimonial describing their experience working with BlazeKonzult will appear here.",
  },
  {
    label: "Healthcare Solutions Provider",
    quote:
      "Placeholder content. A future client testimonial describing their experience working with BlazeKonzult will appear here.",
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
    date: "2026-06-02",
    readTime: "6 min read",
  },
  {
    slug: "nis2-and-the-dutch-cybersecurity-act-what-suppliers-should-prepare",
    title: "NIS2 and the Dutch Cybersecurity Act: What Suppliers Should Prepare",
    excerpt: "What suppliers to regulated organisations should start preparing as expectations evolve.",
    category: "NIS2 & Regulation",
    date: "2026-05-19",
    readTime: "7 min read",
  },
  {
    slug: "how-to-answer-customer-cybersecurity-questionnaires",
    title: "How to Answer Customer Cybersecurity Questionnaires",
    excerpt: "A practical approach to responding accurately and efficiently to security questionnaires.",
    category: "Supplier Assurance",
    date: "2026-05-04",
    readTime: "5 min read",
  },
  {
    slug: "microsoft-365-security-basics-for-small-businesses",
    title: "Microsoft 365 Security Basics for Small Businesses",
    excerpt: "Foundational settings and habits that meaningfully reduce risk in Microsoft 365 environments.",
    category: "Practical Guidance",
    date: "2026-04-21",
    readTime: "6 min read",
  },
  {
    slug: "ransomware-readiness-checklist-for-dutch-msmes",
    title: "Ransomware Readiness Checklist for Dutch MSMEs",
    excerpt: "Key preparations that help smaller organisations respond calmly and recover quickly.",
    category: "Incident Readiness",
    date: "2026-04-08",
    readTime: "8 min read",
  },
  {
    slug: "why-smaller-businesses-need-a-virtual-ciso",
    title: "Why Smaller Businesses Need a Virtual CISO",
    excerpt: "How part-time senior cybersecurity leadership helps growing businesses make better decisions.",
    category: "Governance",
    date: "2026-03-27",
    readTime: "5 min read",
  },
  {
    slug: "what-effective-phishing-awareness-training-looks-like",
    title: "What Effective Phishing Awareness Training Looks Like",
    excerpt: "The elements that separate genuinely effective awareness training from a checkbox exercise.",
    category: "Awareness Training",
    date: "2026-03-11",
    readTime: "5 min read",
  },
  {
    slug: "cybersecurity-for-logistics-healthtech-and-manufacturing-smes",
    title: "Cybersecurity for Logistics, Healthtech and Manufacturing SMEs",
    excerpt: "Sector-specific considerations for organisations that depend on connected operational systems.",
    category: "Sector Insights",
    date: "2026-02-24",
    readTime: "7 min read",
  },
];
