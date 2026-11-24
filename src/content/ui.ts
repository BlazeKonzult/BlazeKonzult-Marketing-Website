import type { Loc } from "@/lib/locale";

/** Interface labels built into the page templates (not edited in the admin). Dutch: draft for review. */
const en = {
  langName: "English", langShort: "EN", switchTo: "Nederlands", switchToShort: "NL", switchLabel: "Bekijk deze pagina in het Nederlands", language: "Language",
  skip: "Skip to main content", menuOpen: "Open menu", menuClose: "Close menu", mainNav: "Main", mobileNav: "Mobile", breadcrumb: "Breadcrumb",
  home: "Home", about: "About", contact: "Contact", services: "Services", industries: "Industries", resources: "Resources", company: "Company", insights: "Insights", legal: "Legal",
  allServices: "All services", allIndustries: "All industries", freeAssessment: "Free readiness assessment",
  menuAssessEyebrow: "Free self-assessment", menuAssessTitle: "How prepared is your business?", menuAssessText: "Five assessments, 5 to 12 minutes, instant results by domain.", startAssessment: "Start the assessment",
  categories: { Assess: "Assess", Prepare: "Prepare", Govern: "Govern", Educate: "Educate", Respond: "Respond", Improve: "Improve" } as Record<string, string>,
  // Service page template
  svcCheckReadiness: "Check your readiness", svcValue: "Value", svcBestFor: "Best suited for", svcOutcomes: "Outcomes",
  svcProblemsEyebrow: "Problems we address", svcProblemsTitle: "What usually brings organisations to us.",
  svcDeliverablesEyebrow: "Deliverables", svcDeliverablesTitle: "What you receive.", svcDeliverablesLead: "Concrete outputs you can act on, share with leadership and reuse with customers.",
  svcExampleEyebrow: "Example outcome", svcExampleTitle: "A 90-day plan, ranked by risk.", svcExampleLead: "Illustrative structure. Your plan is built from your own findings.",
  svcLevelsEyebrow: "Levels of support", svcLevelsTitle: "Flexible engagement models.", svcLevelsLead: "Every engagement is scoped to your organisation. These levels show typical support; ask for a tailored proposal.", svcRequestProposal: "Request a proposal", svcLevel: "Level",
  svcEngagementEyebrow: "Engagement", svcEngagementTitle: "How the engagement runs.", svcRegulatory: "Regulatory context",
  svcFreeResource: "Free resource", svcRequestChecklist: "Request the checklist", svcFaqEyebrow: "FAQ", svcFaqTitle: "Common questions.", svcRelated: "Related services", learnMore: "Learn more",
  // Industries explorer
  indAria: "Industries", indRisk: "Where risk concentrates", indPriorities: "Priorities we recommend", indServices: "Relevant services", indDepends: "Depends on",
  // Articles
  artSearch: "Search articles", artSearchPh: "Search articles…", artFilter: "Filter by category", artAll: "All", artFound: (n: number) => `${n} ${n === 1 ? "article" : "articles"} found`, artNone: "No articles match your search. Try a different term or category.", artBy: "By", artEnglishOnly: "",
  dateLocale: "en-GB",
  // Forms
  fName: "Name", fCompany: "Company", fEmail: "Business email", fPhone: "Phone number", fOptional: "optional", fSize: "Company size", fSizeSelect: "Select company size", fEmployees: "employees",
  fSector: "Sector", fSectorSelect: "Select sector", fNeed: "Primary need", fNeedSelect: "Select primary need", fUrgency: "Urgency", fUrgencySelect: "Select urgency", fMessage: "Message",
  fConsent: "I consent to BlazeKonzult processing my information to respond to this enquiry, in line with the", fPrivacy: "Privacy Policy", fSend: "Send my request", fSending: "Sending…",
  fThanksTitle: "Thank you for reaching out", fThanksText: "We aim to respond within one business day. In the meantime, you can take the free readiness assessment to see where your organisation stands.",
  sectors: [["Professional services", "Professional services"], ["Logistics", "Logistics"], ["Healthcare or healthtech", "Healthcare or healthtech"], ["Manufacturing", "Manufacturing"], ["IT or MSP", "IT or MSP"], ["SaaS or data", "SaaS or data"], ["Other", "Other"]] as [string, string][],
  needs: [["Cybersecurity Health Check", "Cybersecurity Health Check"], ["NIS2 readiness", "NIS2 readiness"], ["Virtual CISO", "Virtual CISO"], ["Awareness training", "Awareness training"], ["Incident readiness", "Incident readiness"], ["Supplier questionnaire support", "Supplier questionnaire support"], ["Not sure", "Not sure"]] as [string, string][],
  urgencies: [["Immediate", "Immediate"], ["Within 30 days", "Within 30 days"], ["Within three months", "Within three months"], ["Exploring", "Exploring"]] as [string, string][],
  lmConsent: "I agree to receive this resource and occasional cybersecurity guidance from BlazeKonzult by email. See our", lmUnsub: "You can unsubscribe at any time.",
  lmThanks: "Thank you — your request has been received.", lmThanksText: (r: string) => `We'll send the ${r} to the email address you provided.`,
  nlAria: "Newsletter signup", nlEmail: "Email address", nlPlaceholder: "you@company.nl", nlSubscribe: "Subscribe", nlThanks: "Thank you for subscribing — you're on the list.",
  errTooMany: "Too many attempts. Please wait a few minutes and try again.", errGeneric: "Sorry, something went wrong. Please try again later.", errNetwork: "Sorry, we couldn't reach the server. Please check your connection and try again.",
  // 404
  nfEyebrow: "Error 404", nfTitle: "This page could not be found.", nfText: "The link may be outdated, or the page may have moved. These are good places to continue:", nfHome: "Go to the homepage", nfServices: "View services", nfContact: "Or [contact us](/contact) if you were looking for something specific.",
  // Assessment preview visual
  pvTitle: "Readiness profile", pvLevel: "DEVELOPING", pvOverall: "Overall maturity across seven domains", pvCaption: "Example of the results view. Your own profile is calculated from your answers, with critical gaps and prioritised actions.",
  pvDomains: { governance: "Governance", identity: "Identity", infrastructure: "Infrastructure", data: "Data & backup", incident: "Incident", awareness: "Awareness", regulatory: "Regulatory" } as Record<string, string>,
};

export type Ui = typeof en;

const nl: Ui = {
  langName: "Nederlands", langShort: "NL", switchTo: "English", switchToShort: "EN", switchLabel: "View this page in English", language: "Taal",
  skip: "Naar de hoofdinhoud", menuOpen: "Menu openen", menuClose: "Menu sluiten", mainNav: "Hoofdmenu", mobileNav: "Mobiel menu", breadcrumb: "Kruimelpad",
  home: "Home", about: "Over ons", contact: "Contact", services: "Diensten", industries: "Sectoren", resources: "Kennisbank", company: "Bedrijf", insights: "Inzichten", legal: "Juridisch",
  allServices: "Alle diensten", allIndustries: "Alle sectoren", freeAssessment: "Gratis gereedheidsscan",
  menuAssessEyebrow: "Gratis zelfscan", menuAssessTitle: "Hoe goed is uw bedrijf voorbereid?", menuAssessText: "Vijf scans, 5 tot 12 minuten, direct resultaat per domein.", startAssessment: "Start de scan",
  categories: { Assess: "Beoordelen", Prepare: "Voorbereiden", Govern: "Sturen", Educate: "Trainen", Respond: "Reageren", Improve: "Verbeteren" },
  svcCheckReadiness: "Test uw gereedheid", svcValue: "Waarde", svcBestFor: "Het meest geschikt voor", svcOutcomes: "Resultaten",
  svcProblemsEyebrow: "Wat wij oplossen", svcProblemsTitle: "Waarom organisaties meestal bij ons komen.",
  svcDeliverablesEyebrow: "Opleveringen", svcDeliverablesTitle: "Wat u ontvangt.", svcDeliverablesLead: "Concrete resultaten waarmee u aan de slag kunt, die u met de directie deelt en hergebruikt richting klanten.",
  svcExampleEyebrow: "Voorbeeldresultaat", svcExampleTitle: "Een 90-dagenplan, gerangschikt op risico.", svcExampleLead: "Ter illustratie. Uw plan wordt opgesteld op basis van uw eigen bevindingen.",
  svcLevelsEyebrow: "Ondersteuningsniveaus", svcLevelsTitle: "Flexibele samenwerkingsvormen.", svcLevelsLead: "Elke opdracht wordt afgestemd op uw organisatie. Deze niveaus tonen gangbare ondersteuning; vraag een voorstel op maat aan.", svcRequestProposal: "Vraag een voorstel aan", svcLevel: "Niveau",
  svcEngagementEyebrow: "Werkwijze", svcEngagementTitle: "Zo verloopt de opdracht.", svcRegulatory: "Regelgeving",
  svcFreeResource: "Gratis download", svcRequestChecklist: "Vraag de checklist aan", svcFaqEyebrow: "Veelgestelde vragen", svcFaqTitle: "Veelgestelde vragen.", svcRelated: "Gerelateerde diensten", learnMore: "Meer informatie",
  indAria: "Sectoren", indRisk: "Waar het risico zit", indPriorities: "Wat wij aanbevelen", indServices: "Relevante diensten", indDepends: "Afhankelijk van",
  artSearch: "Artikelen zoeken", artSearchPh: "Zoek in artikelen…", artFilter: "Filter op categorie", artAll: "Alle", artFound: (n: number) => `${n} ${n === 1 ? "artikel" : "artikelen"} gevonden`, artNone: "Geen artikelen gevonden. Probeer een andere zoekterm of categorie.", artBy: "Door", artEnglishOnly: "Dit artikel is alleen in het Engels beschikbaar.",
  dateLocale: "nl-NL",
  fName: "Naam", fCompany: "Bedrijf", fEmail: "Zakelijk e-mailadres", fPhone: "Telefoonnummer", fOptional: "optioneel", fSize: "Bedrijfsgrootte", fSizeSelect: "Kies de bedrijfsgrootte", fEmployees: "medewerkers",
  fSector: "Sector", fSectorSelect: "Kies een sector", fNeed: "Belangrijkste behoefte", fNeedSelect: "Kies uw behoefte", fUrgency: "Urgentie", fUrgencySelect: "Kies de urgentie", fMessage: "Bericht",
  fConsent: "Ik ga ermee akkoord dat BlazeKonzult mijn gegevens verwerkt om op deze aanvraag te reageren, in lijn met de", fPrivacy: "privacyverklaring", fSend: "Verstuur mijn aanvraag", fSending: "Bezig met versturen…",
  fThanksTitle: "Bedankt voor uw bericht", fThanksText: "Wij reageren meestal binnen één werkdag. Intussen kunt u de gratis gereedheidsscan doen om te zien waar uw organisatie staat.",
  sectors: [["Professional services", "Zakelijke dienstverlening"], ["Logistics", "Logistiek"], ["Healthcare or healthtech", "Zorg of healthtech"], ["Manufacturing", "Productie"], ["IT or MSP", "IT of MSP"], ["SaaS or data", "SaaS of data"], ["Other", "Anders"]],
  needs: [["Cybersecurity Health Check", "Cybersecurity Health Check"], ["NIS2 readiness", "NIS2-gereedheid"], ["Virtual CISO", "Virtuele CISO"], ["Awareness training", "Awarenesstraining"], ["Incident readiness", "Voorbereiding op incidenten"], ["Supplier questionnaire support", "Hulp bij vragenlijsten van klanten"], ["Not sure", "Weet ik nog niet"]],
  urgencies: [["Immediate", "Direct"], ["Within 30 days", "Binnen 30 dagen"], ["Within three months", "Binnen drie maanden"], ["Exploring", "Ik oriënteer me"]],
  lmConsent: "Ik wil deze download en af en toe cybersecurityadvies van BlazeKonzult per e-mail ontvangen. Zie onze", lmUnsub: "Afmelden kan altijd.",
  lmThanks: "Bedankt, uw aanvraag is ontvangen.", lmThanksText: (r: string) => `We sturen de ${r} naar het e-mailadres dat u heeft opgegeven.`,
  nlAria: "Aanmelden voor de nieuwsbrief", nlEmail: "E-mailadres", nlPlaceholder: "u@bedrijf.nl", nlSubscribe: "Aanmelden", nlThanks: "Bedankt voor uw aanmelding.",
  errTooMany: "Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.", errGeneric: "Er ging iets mis. Probeer het later opnieuw.", errNetwork: "De server is niet bereikbaar. Controleer uw verbinding en probeer het opnieuw.",
  nfEyebrow: "Fout 404", nfTitle: "Deze pagina bestaat niet.", nfText: "De link is mogelijk verouderd of de pagina is verplaatst. Hier kunt u verder:", nfHome: "Naar de homepage", nfServices: "Bekijk de diensten", nfContact: "Of [neem contact op](/nl/contact) als u iets specifieks zocht.",
  pvTitle: "Gereedheidsprofiel", pvLevel: "IN ONTWIKKELING", pvOverall: "Totale volwassenheid over zeven domeinen", pvCaption: "Voorbeeld van de resultaten. Uw eigen profiel wordt berekend uit uw antwoorden, met kritieke hiaten en geprioriteerde acties.",
  pvDomains: { governance: "Governance", identity: "Identiteit", infrastructure: "Infrastructuur", data: "Data & back-up", incident: "Incidenten", awareness: "Awareness", regulatory: "Regelgeving" },
};

export const UI: Record<Loc, Ui> = { en, nl };
