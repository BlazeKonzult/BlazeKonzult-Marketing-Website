// Structured content for each service landing page.
// Layout is fixed by the ServicePage template; content stays editable here.

export type ServiceVisual = "maturity" | "regulation" | "governance" | "cycle" | "awareness" | "response" | "assurance";

export type ServiceContent = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lead: string;
  primaryCta: string;
  visual: ServiceVisual;
  valueProp: { title: string; body: string };
  bestFor: string;
  problems: { title: string; description: string }[];
  deliverables: { title: string; description: string; icon: string }[];
  benefits: string[];
  method: { title: string; description: string }[];
  regulatory: { title: string; body: string; points: string[] };
  roadmap?: { phase: string; focus: string }[];
  tiers?: { name: string; description: string; features: string[] }[];
  checklist?: { name: string; description: string };
  related: string[];
  faqs: { question: string; answer: string }[];
  closing: { title: string; body: string };
};

export const serviceContent: ServiceContent[] = [
  {
    slug: "cybersecurity-health-check",
    metaTitle: "Cybersecurity Health Check for SMEs",
    metaDescription:
      "A fixed-scope Cybersecurity Health Check for Dutch SMEs: baseline maturity review, risk summary, executive report and a prioritised 90-day action plan.",
    eyebrow: "Service · Assess",
    title: "Know where you stand, and what to fix first.",
    lead: "A fixed-scope review of your current cybersecurity posture, priority risks and recommended improvements, explained in plain business language.",
    primaryCta: "Request a Health Check",
    visual: "maturity",
    valueProp: {
      title: "An independent baseline, without committing to a large programme.",
      body: "Most organisations know security matters but cannot say which gaps are most dangerous. The Health Check gives leadership a clear, evidence-based picture and a short list of actions ranked by risk, cost and urgency.",
    },
    bestFor: "Organisations that are unsure where their cybersecurity currently stands, or are facing customer security questions for the first time.",
    problems: [
      { title: "No clear picture of risk", description: "Security decisions are made on instinct or vendor advice rather than an assessment of what matters most." },
      { title: "Budget without priorities", description: "There are dozens of possible improvements and no way to tell which ones reduce the most risk first." },
      { title: "Unanswered customer questions", description: "Customers and insurers ask for evidence of controls that nobody has documented." },
    ],
    deliverables: [
      { title: "Baseline maturity review", description: "Your position across governance, identity, devices, data, people, incidents and suppliers.", icon: "Gauge" },
      { title: "Risk summary", description: "The most significant risks in business terms, with likelihood and impact.", icon: "AlertTriangle" },
      { title: "Executive report", description: "A concise report written for directors and owners, not specialists.", icon: "FileText" },
      { title: "90-day action plan", description: "Prioritised actions with owners, so improvement starts the week after.", icon: "CalendarRange" },
    ],
    benefits: [
      "A defensible view of your security posture",
      "Investment directed at the risks that matter",
      "Evidence you can share with customers and insurers",
      "A practical starting point for ongoing improvement",
    ],
    method: [
      { title: "Scoping call", description: "Agree the systems, sites and people in scope, and the questions leadership needs answered." },
      { title: "Structured review", description: "Interviews, configuration checks and document review against recognised good practice." },
      { title: "Risk analysis", description: "Findings are rated and translated into business impact." },
      { title: "Report and walkthrough", description: "We present the findings to leadership and agree the 90-day plan." },
    ],
    regulatory: {
      title: "Built on recognised frameworks",
      body: "The review draws on widely used good practice so your results can be compared with what customers, insurers and regulators expect.",
      points: ["CIS Controls and ISO/IEC 27001 control areas", "GDPR security obligations (Article 32)", "NIS2 duty-of-care themes where relevant"],
    },
    roadmap: [
      { phase: "Days 1–30", focus: "Close urgent, high-impact gaps such as MFA and backups" },
      { phase: "Days 31–60", focus: "Strengthen core controls, access and policies" },
      { phase: "Days 61–90", focus: "Build awareness, test response and plan the next cycle" },
    ],
    related: ["managed-security", "virtual-ciso", "nis2-readiness"],
    faqs: [
      { question: "Who is the Health Check for?", answer: "Any organisation that is unsure of its current cybersecurity maturity, from micro-businesses to mid-sized companies, and wants a clear, practical starting point." },
      { question: "How long does it take?", answer: "Most Health Checks are completed within a few weeks from the scoping call to the final report, depending on the size and complexity of your organisation." },
      { question: "Do we need technical staff involved?", answer: "It helps to have someone who knows your IT setup available for a short discussion, but the report is written for business leaders, not just technical teams." },
      { question: "What happens after the Health Check?", answer: "You receive a prioritised 90-day action plan. Many clients then choose Managed Security Essentials or Virtual CISO support to implement it." },
    ],
    closing: { title: "Start with a clear baseline.", body: "Tell us about your organisation and we will propose a scope and timeline for your Health Check." },
  },
  {
    slug: "nis2-readiness",
    metaTitle: "NIS2 Readiness for Dutch Organisations and Suppliers",
    metaDescription:
      "Readiness guidance for NIS2 and the Dutch Cybersecurity Act: applicability screening, gap assessment, governance recommendations and supplier-readiness support.",
    eyebrow: "Service · Prepare",
    title: "Prepare for NIS2 and the Dutch Cybersecurity Act.",
    lead: "Understand whether the Cyberbeveiligingswet applies to you or your customers, close the gaps that matter and show your board and customers a credible plan.",
    primaryCta: "Request a NIS2 Readiness Assessment",
    visual: "regulation",
    valueProp: {
      title: "From uncertainty about scope to a documented readiness plan.",
      body: "The Dutch Cybersecurity Act entered into force on 15 August 2026, bringing duty-of-care, incident-reporting and management-accountability obligations to thousands of organisations, and to their suppliers through contracts. We help you establish your position and act proportionately.",
    },
    bestFor: "Medium and large organisations in NIS2 sectors, and suppliers whose customers are essential or important entities.",
    problems: [
      { title: "Unclear applicability", description: "Sector, size and group structure determine scope, and many organisations have not checked carefully." },
      { title: "Board accountability", description: "Management carries ultimate responsibility for cyber risk and must be able to oversee it knowledgeably." },
      { title: "Pressure through the supply chain", description: "In-scope customers must manage supplier risk, so questionnaires and contract clauses are arriving." },
    ],
    deliverables: [
      { title: "Applicability screening", description: "A structured review of whether, and how, the Cbw may apply to you.", icon: "ScanSearch" },
      { title: "Gap assessment", description: "Your current measures compared with NIS2 duty-of-care themes.", icon: "ListChecks" },
      { title: "Governance recommendations", description: "Roles, reporting lines and board oversight that fit your size.", icon: "Landmark" },
      { title: "Supplier-readiness checklist", description: "What your customers are likely to ask, and how to evidence it.", icon: "ClipboardCheck" },
    ],
    benefits: [
      "Clarity on your position under the Cbw",
      "Leadership able to evidence oversight",
      "Incident reporting you can actually meet",
      "Stronger standing with regulated customers",
    ],
    method: [
      { title: "Screening", description: "Sector, size and role in the supply chain assessed against the Cbw criteria." },
      { title: "Gap assessment", description: "Risk management, incident handling, continuity and supply-chain measures reviewed." },
      { title: "Roadmap", description: "Prioritised actions, owners and timelines that leadership can approve." },
      { title: "Board briefing", description: "A briefing so directors understand their responsibilities and the plan." },
    ],
    regulatory: {
      title: "What the Cyberbeveiligingswet introduces",
      body: "The Cbw implements the EU NIS2 Directive in the Netherlands and has applied since 15 August 2026. In-scope organisations must register with the NCSC and assess for themselves whether the law applies.",
      points: [
        "Risk-based duty of care for network and information systems",
        "Significant incidents: early warning within 24 hours, notification within 72 hours, final report within one month",
        "Ultimate responsibility for cyber risk with management",
        "Essential entities supervised proactively; important entities mostly after the fact",
        "Supply-chain security as an explicit obligation",
      ],
    },
    checklist: {
      name: "NIS2 Supplier Readiness Checklist",
      description: "A practical checklist for suppliers preparing for customer questions linked to NIS2.",
    },
    related: ["supplier-security-assurance", "incident-response-readiness", "virtual-ciso"],
    faqs: [
      { question: "Does NIS2 apply to my organisation?", answer: "It depends on your sector, size and role in the supply chain. Many smaller organisations are not directly in scope but face NIS2-related requirements from larger customers. An applicability screening clarifies your position." },
      { question: "What is the Dutch Cybersecurity Act?", answer: "The Cyberbeveiligingswet (Cbw) is the Dutch law implementing the EU NIS2 Directive. It entered into force on 15 August 2026." },
      { question: "We are a supplier, not directly regulated. Does this matter?", answer: "Usually, yes. Regulated organisations must manage the cybersecurity of their suppliers, so demonstrating readiness becomes a commercial advantage." },
      { question: "Can BlazeKonzult confirm our legal obligations?", answer: "We provide practical readiness guidance based on the published legislation and regulator guidance. For definitive legal interpretation, we recommend also consulting qualified legal counsel." },
    ],
    closing: { title: "Turn regulatory uncertainty into a plan.", body: "Book a consultation to discuss your organisation's position under NIS2 and the Dutch Cybersecurity Act." },
  },
  {
    slug: "virtual-ciso",
    metaTitle: "Virtual CISO Services in the Netherlands",
    metaDescription:
      "Part-time senior cybersecurity leadership for Dutch SMEs: strategy, risk reporting, policy development, governance and board reporting without a full-time hire.",
    eyebrow: "Service · Govern",
    title: "Senior security leadership, without a full-time hire.",
    lead: "A Virtual CISO gives your organisation part-time, senior-level cybersecurity leadership: strategy, structure and accountability at a fraction of the cost of an executive role.",
    primaryCta: "Discuss Virtual CISO Support",
    visual: "governance",
    valueProp: {
      title: "Someone accountable for security direction, every month.",
      body: "Without an owner, security work becomes reactive: driven by the latest tool pitch or customer questionnaire. A Virtual CISO brings a plan, a rhythm of review and a clear line between security spending and business risk.",
    },
    bestFor: "Growing businesses that need senior cybersecurity guidance but are not ready for a full-time CISO.",
    problems: [
      { title: "No owner for security strategy", description: "IT providers run operations, but nobody sets direction or holds them to account." },
      { title: "Leadership without visibility", description: "Directors cannot tell whether the organisation is getting safer or simply spending more." },
      { title: "Growing external scrutiny", description: "Customers, auditors and regulators ask governance questions that need a senior answer." },
    ],
    deliverables: [
      { title: "Cybersecurity strategy", description: "A business-aligned direction for security investment and priorities.", icon: "Compass" },
      { title: "Risk register", description: "A maintained record of risks, owners and treatment decisions.", icon: "Table2" },
      { title: "Policies that fit", description: "Practical policies and procedures sized to your maturity.", icon: "FileText" },
      { title: "Management reporting", description: "Regular reporting that translates risk into business terms.", icon: "BarChart3" },
    ],
    benefits: [
      "Senior expertise for a fraction of an executive salary",
      "A security roadmap leadership understands",
      "Consistent oversight of IT providers",
      "Confident answers to customers and auditors",
    ],
    method: [
      { title: "Onboarding", description: "Understand the business, current controls and immediate concerns." },
      { title: "First 90 days", description: "Risk register, priority fixes and an agreed roadmap." },
      { title: "Monthly cadence", description: "Advisory sessions, progress tracking and decisions recorded." },
      { title: "Quarterly review", description: "Reporting to leadership and adjustment of priorities." },
    ],
    regulatory: {
      title: "Governance regulators expect",
      body: "NIS2 places ultimate responsibility for cyber risk with management and expects directors to have enough knowledge to oversee it. A Virtual CISO helps leadership meet that expectation.",
      points: ["Board-level oversight and reporting", "Documented risk-management decisions", "Assigned responsibilities for security"],
    },
    tiers: [
      { name: "Foundation", description: "Establishing the basics of cybersecurity governance.", features: ["Monthly advisory session", "Risk register set-up", "Core policy guidance", "Quarterly reporting"] },
      { name: "Growth", description: "Scaling security practices alongside the organisation.", features: ["Everything in Foundation", "Governance meeting cadence", "Supplier assurance support", "Monthly management reporting"] },
      { name: "Strategic", description: "Deeper, board-level cybersecurity leadership.", features: ["Everything in Growth", "Board-level reporting", "Strategic roadmap ownership", "Incident-readiness oversight"] },
    ],
    related: ["managed-security", "nis2-readiness", "cybersecurity-health-check"],
    faqs: [
      { question: "Do we need a full-time CISO?", answer: "Not necessarily. Many small and mid-sized organisations benefit more from part-time senior guidance than from a full-time hire." },
      { question: "How much time does a Virtual CISO spend with us?", answer: "It is agreed per engagement, typically a set number of days or hours each month, plus availability for urgent questions." },
      { question: "Will the Virtual CISO work with our IT provider?", answer: "Yes. Setting direction for, and checking the work of, your IT provider or MSP is a core part of the role." },
    ],
    closing: { title: "Put someone in charge of security direction.", body: "Let's discuss what Virtual CISO support could look like for your organisation." },
  },
  {
    slug: "managed-security",
    metaTitle: "Managed Security Essentials for SMEs",
    metaDescription:
      "Ongoing cybersecurity oversight and improvement coordination for Dutch SMEs: monthly reviews, vulnerability follow-up and cloud security review coordination.",
    eyebrow: "Service · Improve",
    title: "Security that keeps moving forward, month after month.",
    lead: "Continuous oversight and coordination that turns a one-off assessment into steady, measurable improvement, without building an internal security team.",
    primaryCta: "Request a Tailored Proposal",
    visual: "cycle",
    valueProp: {
      title: "Improvement that does not stall after the report.",
      body: "Assessment reports often sit unread once the urgent fixes are done. Managed Security Essentials keeps a living improvement plan, follows up vulnerabilities and makes sure your cloud and IT providers keep security on the agenda.",
    },
    bestFor: "Organisations that have completed an initial assessment and want ongoing coordination to implement and sustain improvements.",
    problems: [
      { title: "Plans that lose momentum", description: "Recommendations are agreed, then crowded out by daily operations." },
      { title: "Vulnerabilities that linger", description: "Findings are logged but nobody follows them through to resolution." },
      { title: "Cloud settings that drift", description: "Configurations change as people join, leave and add new tools." },
    ],
    deliverables: [
      { title: "Monthly security review", description: "A recurring review of posture, priorities and open items.", icon: "CalendarCheck2" },
      { title: "Improvement tracker", description: "A living record of improvements and their progress.", icon: "ListTodo" },
      { title: "Vulnerability follow-up", description: "Identified weaknesses tracked through to resolution.", icon: "Bug" },
      { title: "Cloud review coordination", description: "Regular checks on cloud configuration and access.", icon: "CloudCog" },
    ],
    benefits: [
      "Consistent visibility of your security posture",
      "Fewer overlooked vulnerabilities",
      "Improvement tracked over time",
      "A trusted point of contact for security questions",
    ],
    method: [
      { title: "Baseline", description: "Start from a Health Check or existing assessment." },
      { title: "Plan", description: "Agree the improvement tracker and responsibilities." },
      { title: "Review monthly", description: "Check progress, new risks and open vulnerabilities." },
      { title: "Report", description: "Short monthly summary for leadership." },
    ],
    regulatory: {
      title: "Evidence of continuous improvement",
      body: "Customers, insurers and regulators increasingly look for proof that security is maintained, not just assessed once. The tracker and monthly reports provide that evidence.",
      points: ["Documented, recurring review cycle", "Traceable remediation of findings", "Records that support audits and questionnaires"],
    },
    related: ["cybersecurity-health-check", "virtual-ciso", "supplier-security-assurance"],
    faqs: [
      { question: "How is this different from a Health Check?", answer: "A Health Check is a one-time assessment. Managed Security Essentials provides recurring oversight to keep improving your posture over time." },
      { question: "Do you replace our existing IT provider?", answer: "No. We work alongside your IT provider or MSP, focusing on security oversight and coordination rather than day-to-day IT support." },
      { question: "Is this suitable for very small businesses?", answer: "Yes. The service is scoped to your size, so smaller organisations receive a lighter-touch version of the same ongoing attention." },
    ],
    closing: { title: "Keep improvement on the agenda.", body: "Request a tailored proposal for ongoing security oversight." },
  },
  {
    slug: "security-awareness-training",
    metaTitle: "Security Awareness and Phishing Training",
    metaDescription:
      "Practical security awareness and phishing training for Dutch SMEs: employee sessions, phishing simulations, awareness metrics and supportive coaching.",
    eyebrow: "Service · Educate",
    title: "Help your people spot the threat before it spreads.",
    lead: "Practical, supportive training that helps employees recognise phishing, social engineering and payment fraud, and report it quickly.",
    primaryCta: "Request a Tailored Proposal",
    visual: "awareness",
    valueProp: {
      title: "Fast reporting beats perfect detection.",
      body: "Some convincing messages will always reach your staff. Effective training makes reporting easy and welcome, so one early report can protect the whole organisation.",
    },
    bestFor: "Teams of any size that rely on email and everyday digital tools, which is nearly every business today.",
    problems: [
      { title: "Convincing, AI-written lures", description: "Phishing and voice impersonation are harder to spot than ever." },
      { title: "Payment and invoice fraud", description: "A single changed bank account number can cost more than a year of security budget." },
      { title: "Training that does not stick", description: "Annual videos and quizzes are forgotten within weeks." },
    ],
    deliverables: [
      { title: "Employee sessions", description: "Short, relevant sessions built on real examples from your sector.", icon: "Presentation" },
      { title: "Phishing simulations", description: "Controlled simulations followed by immediate, constructive guidance.", icon: "MailWarning" },
      { title: "Awareness metrics", description: "Reporting rates and response times, not just click counts.", icon: "BarChart3" },
      { title: "Coaching", description: "Supportive, non-punitive follow-up where it is needed.", icon: "MessagesSquare" },
    ],
    benefits: [
      "Staff who recognise and report suspicious activity",
      "Fewer successful phishing and fraud attempts",
      "Measurable awareness progress",
      "A calmer, more confident security culture",
    ],
    method: [
      { title: "Baseline", description: "Understand current habits and the threats most relevant to you." },
      { title: "Train", description: "Interactive sessions for staff and a separate briefing for leadership." },
      { title: "Simulate", description: "Periodic simulations with immediate learning moments." },
      { title: "Measure", description: "Track reporting rates and adjust the programme." },
    ],
    regulatory: {
      title: "Training is a recognised control",
      body: "NIS2 lists basic cyber hygiene and cybersecurity training among the risk-management measures expected of in-scope organisations, and customers often ask for training records.",
      points: ["Training records for audits and questionnaires", "Management training on cyber risk", "Documented verification procedures"],
    },
    related: ["incident-response-readiness", "cybersecurity-health-check", "managed-security"],
    faqs: [
      { question: "Will this embarrass employees who fall for a simulation?", answer: "No. The approach is supportive and educational. The goal is confidence and awareness, not singling out individuals." },
      { question: "How often should training happen?", answer: "We recommend an initial session followed by short periodic simulations and refreshers, tailored to your risk profile." },
      { question: "Is this only about phishing emails?", answer: "Phishing is a major focus, but training also covers text messages, phone calls, fake login pages and payment-change fraud." },
    ],
    closing: { title: "Make your team your early-warning system.", body: "Request a proposal for a training programme sized to your organisation." },
  },
  {
    slug: "incident-response-readiness",
    metaTitle: "Incident Response Readiness",
    metaDescription:
      "Incident response readiness for Dutch SMEs: response plans, tabletop exercises, backup and recovery reviews and escalation checklists.",
    eyebrow: "Service · Respond",
    title: "Respond with confidence, not confusion.",
    lead: "No organisation can eliminate every risk. What matters is a tested plan, clear roles and backups you know will work when it counts.",
    primaryCta: "Request a Tailored Proposal",
    visual: "response",
    valueProp: {
      title: "Decide how you will respond before you have to.",
      body: "The first hours of an incident decide much of its cost. Organisations that have agreed who decides, who to call and what to restore first recover faster and communicate better.",
    },
    bestFor: "Any organisation that depends on its systems, data or reputation, and wants to be ready before an incident occurs.",
    problems: [
      { title: "No agreed decision-maker", description: "In a crisis, nobody is sure who can authorise shutting systems down or calling in help." },
      { title: "Untested backups", description: "Backups exist, but nobody knows how long a full restore takes, or whether it works." },
      { title: "Reporting deadlines", description: "GDPR breach and NIS2 incident deadlines start running from the moment you become aware." },
    ],
    deliverables: [
      { title: "Incident response plan", description: "A practical plan tailored to your systems and priorities.", icon: "FileText" },
      { title: "Tabletop exercise", description: "A guided walkthrough of a realistic scenario with your team.", icon: "Users2" },
      { title: "Backup and recovery review", description: "An honest check that recovery would actually work.", icon: "DatabaseBackup" },
      { title: "Escalation checklist", description: "Who to contact and what to do first, on one page.", icon: "ListOrdered" },
    ],
    benefits: [
      "A tested, realistic response plan",
      "Clear roles and escalation paths",
      "Confidence that recovery will work",
      "Less disruption and faster recovery",
    ],
    method: [
      { title: "Prepare", description: "Map critical systems, contacts and decision rights." },
      { title: "Plan", description: "Write the response plan and one-page escalation checklist." },
      { title: "Exercise", description: "Run a tabletop scenario with leadership and key staff." },
      { title: "Improve", description: "Fix gaps found in the exercise and review the plan annually." },
    ],
    regulatory: {
      title: "Reporting obligations to plan for",
      body: "Personal data breaches must be reported to the Autoriteit Persoonsgegevens within 72 hours where required. Organisations in Cbw scope have additional incident-reporting duties.",
      points: ["GDPR: notify the Dutch DPA within 72 hours where required", "NIS2: early warning within 24 hours, notification within 72 hours", "Final report within one month for significant incidents"],
    },
    related: ["security-awareness-training", "nis2-readiness", "managed-security"],
    faqs: [
      { question: "Do you handle live incidents for us?", answer: "This service focuses on readiness: building your plan, testing it and finding gaps, so your organisation can respond calmly if an incident occurs." },
      { question: "What is a tabletop exercise?", answer: "A structured, discussion-based session where your team walks through a realistic incident scenario, without touching live systems." },
      { question: "We already have backups. Is this still useful?", answer: "Having backups and being able to recover quickly and completely are not the same thing. The recovery review tests that assumption." },
    ],
    closing: { title: "Be ready before the bad day.", body: "Request a proposal for incident response planning and a tabletop exercise." },
  },
  {
    slug: "supplier-security-assurance",
    metaTitle: "Supplier Security Assurance",
    metaDescription:
      "Help for SMEs answering customer security questionnaires: questionnaire support, evidence preparation, control-gap identification and remediation roadmaps.",
    eyebrow: "Service · Assure",
    title: "Answer customer security questions with confidence.",
    lead: "Larger customers expect suppliers to demonstrate cybersecurity maturity. We help you respond accurately, prepare evidence and close genuine gaps.",
    primaryCta: "Get Questionnaire Support",
    visual: "assurance",
    valueProp: {
      title: "Turn due diligence from a blocker into an advantage.",
      body: "Questionnaires can run to hundreds of questions with tight deadlines. A reusable answer library and evidence pack shortens every future response and shows customers you take security seriously.",
    },
    bestFor: "Suppliers to larger customers, regulated industries or the public sector who are asked to prove their security maturity.",
    problems: [
      { title: "Long questionnaires, short deadlines", description: "Unfamiliar terminology and hundreds of questions arrive with a contract at stake." },
      { title: "Missing evidence", description: "Controls may exist, but there is no documentation to prove it." },
      { title: "Real gaps under scrutiny", description: "Some answers are honestly 'no', and customers want a plan to close them." },
    ],
    deliverables: [
      { title: "Questionnaire support", description: "Accurate answers that do not over-promise.", icon: "FileQuestion" },
      { title: "Evidence pack", description: "Policies, screenshots and records organised for reuse.", icon: "FolderCheck" },
      { title: "Control-gap identification", description: "A clear view of where you fall short of expectations.", icon: "SearchX" },
      { title: "Remediation roadmap", description: "A prioritised plan to close gaps that customers raise.", icon: "Route" },
    ],
    benefits: [
      "Faster, consistent questionnaire responses",
      "Evidence ready before it is requested",
      "Honest answers backed by a plan",
      "Stronger customer relationships",
    ],
    method: [
      { title: "Triage", description: "Map questions to themes and identify what is already in place." },
      { title: "Evidence", description: "Collect and organise proof for each answer." },
      { title: "Respond", description: "Draft accurate answers and explain genuine gaps." },
      { title: "Remediate", description: "Close gaps in priority order and update the library." },
    ],
    regulatory: {
      title: "Why the questions are increasing",
      body: "Organisations within NIS2 scope must manage risks from their suppliers, and GDPR requires controllers to use processors that provide sufficient guarantees.",
      points: ["NIS2 supply-chain security obligations", "GDPR processor guarantees (Article 28)", "Frameworks customers reference: ISO/IEC 27001, NEN 7510"],
    },
    checklist: {
      name: "Cyber Resilience Checklist",
      description: "The essential controls customers most often ask suppliers about.",
    },
    related: ["nis2-readiness", "cybersecurity-health-check", "virtual-ciso"],
    faqs: [
      { question: "We just received a long questionnaire. Can you help quickly?", answer: "Yes. We can support you in interpreting and responding accurately under time pressure, while flagging genuine gaps that need attention." },
      { question: "Do you help us close identified gaps?", answer: "Yes. You receive a prioritised remediation roadmap, and we can support implementation through Managed Security Essentials or Virtual CISO services." },
      { question: "Is this only for large suppliers?", answer: "No. Micro and small suppliers increasingly face these questionnaires, and the service is scoped to fit organisations of any size." },
    ],
    closing: { title: "Win the deal, not just the questionnaire.", body: "Send us the questionnaire you are facing and we will propose how to tackle it." },
  },
];

export const contentBySlug = (slug: string) => serviceContent.find((s) => s.slug === slug)!;
