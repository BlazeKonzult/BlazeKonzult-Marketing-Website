/**
 * Dutch default content (draft translation; have it reviewed by a native speaker).
 * Same structure as the English defaults in ../defaults.ts. Internal links point to /nl/ pages.
 */
const cta = (label: string, href: string) => ({ label, href });
const closing = (title: string, body: string, primary = cta("Plan een adviesgesprek", "/nl/contact"), secondary = cta("Doe de gereedheidsscan", "/nl/cybersecurity-assessment/")) => ({ title, body, primary, secondary });
const sec = (eyebrow: string, title: string, lead = "") => ({ eyebrow, title, lead });

export const credentialsNl = [
  { code: "CISSP", name: "Certified Information Systems Security Professional" },
  { code: "CISM", name: "Certified Information Security Manager" },
  { code: "CCSP", name: "Certified Cloud Security Professional" },
  { code: "CEH", name: "Certified Ethical Hacker" },
  { code: "PMP", name: "Project Management Professional" },
];

export const methodologyNl = [
  { step: "01", title: "Verkennen", description: "We leren hoe uw organisatie werkt, waar zij van afhankelijk is en wat klanten en toezichthouders verwachten.", output: "Reikwijdte en prioriteiten vastgesteld" },
  { step: "02", title: "Beoordelen", description: "We toetsen maatregelen, processen en leveranciers aan erkende good practice en uw verplichtingen.", output: "Onderbouwde bevindingen" },
  { step: "03", title: "Plannen", description: "Bevindingen worden een roadmap, gerangschikt op risico, kosten en urgentie, geschreven voor beslissers.", output: "Geprioriteerde roadmap" },
  { step: "04", title: "Invoeren", description: "We begeleiden uw team en IT-leverancier bij de wijzigingen, van beleid tot technische instellingen.", output: "Maatregelen ingevoerd" },
  { step: "05", title: "Verbeteren", description: "Regelmatige reviews volgen de voortgang, toetsen aannames opnieuw en passen aan op nieuwe dreigingen en eisen.", output: "Meetbare voortgang" },
];

export const siteNl = {
  company: {
    name: "BlazeKonzult",
    founder: "Adeiza Johnson Yisa",
    tagline: "Helder advies. Praktische actie. Sterkere weerbaarheid.",
    supportingMessage: "Praktische cybersecurity voor Nederlandse mkb-bedrijven en groeiende organisaties.",
    linkedin: "https://www.linkedin.com/in/dazzy",
    serviceArea: "Nederland, met ondersteuning op afstand in de hele EU",
    founderTitle: "Oprichter en principal consultant",
    founderPhoto: "/images/adeiza-johnson-yisa.jpg",
    founderPhotoAlt: "Adeiza Johnson Yisa, oprichter van BlazeKonzult",
  },
  seo: {
    defaultTitle: "BlazeKonzult | Cybersecurityadvies voor het Nederlandse mkb",
    titleSuffix: "BlazeKonzult",
    description: "BlazeKonzult biedt praktisch cybersecurityadvies voor het Nederlandse mkb: health checks, NIS2-gereedheid, virtuele CISO, awarenesstraining en voorbereiding op incidenten.",
    keywords: "cybersecurity mkb, cybersecurity advies Nederland, NIS2 gereedheid, Cyberbeveiligingswet, virtuele CISO, cybersecurity health check",
    socialImage: "",
  },
  header: {
    nav: [
      { label: "Diensten", href: "/nl/services" },
      { label: "Sectoren", href: "/nl/industries" },
      { label: "Inzichten", href: "/nl/resources" },
      { label: "Over ons", href: "/nl/about" },
      { label: "Contact", href: "/nl/contact" },
    ],
    ctaLabel: "Plan een adviesgesprek",
    ctaHref: "/nl/contact",
  },
  footer: {
    blurb: "Praktisch cybersecurityadvies op senior niveau voor kleine en middelgrote bedrijven in Nederland.",
    resourceLinks: [cta("Gereedheidsscan", "/nl/cybersecurity-assessment/"), cta("Inzichten", "/nl/resources"), cta("Checklists", "/nl/resources#checklists"), cta("Responsible disclosure", "/nl/responsible-disclosure")],
    companyLinks: [cta("Over ons", "/nl/about"), cta("Contact", "/nl/contact"), cta("Plan een adviesgesprek", "/nl/contact")],
    legalLinks: [cta("Privacyverklaring", "/nl/privacy-policy"), cta("Cookies", "/nl/cookie-policy")],
    copyright: "BlazeKonzult. Alle rechten voorbehouden.",
  },
  credentials: credentialsNl,
  frameworks: ["NIS2 / Cyberbeveiligingswet", "AVG / GDPR", "ISO/IEC 27001", "NEN 7510", "CIS Controls"],
  methodology: methodologyNl,
  serviceGroups: [
    { label: "Beoordelen en voorbereiden", description: "Weet waar u staat en wat er van u wordt verwacht.", slugs: ["cybersecurity-health-check", "nis2-readiness", "supplier-security-assurance"] },
    { label: "Sturen en verbeteren", description: "Senior richting en gestage, meetbare vooruitgang.", slugs: ["virtual-ciso", "managed-security"] },
    { label: "Beschermen en reageren", description: "Bereid uw mensen en uw plan voor op een slechte dag.", slugs: ["security-awareness-training", "incident-response-readiness"] },
  ],
};

export const homeNl = {
  seo: { title: "BlazeKonzult | Cyberweerbaarheid. Zakelijk vertrouwen.", description: "Cybersecurityadvies op senior niveau voor het Nederlandse mkb: Cybersecurity Health Checks, gereedheid voor NIS2 en de Cyberbeveiligingswet, virtuele CISO, awarenesstraining en voorbereiding op incidenten." },
  hero: {
    eyebrow: "Cybersecurityadvies · Nederland",
    titleLine1: "Cyberweerbaarheid.",
    titleLine2: "Zakelijk vertrouwen.",
    lead: "Bescherm uw bedrijf, houd grip op veranderende cybersecurityregels en bouw een sterker beveiligingsfundament met deskundig advies dat past bij uw organisatie.",
    primary: cta("Plan een gratis adviesgesprek", "/nl/contact"),
    secondary: cta("Test uw cyberweerbaarheid", "/nl/cybersecurity-assessment/"),
    credentialsLabel: "Certificeringen van de oprichter",
    frameworksLabel: "Wij helpen u met",
  },
  challenges: {
    ...sec("Waarom het ertoe doet", "Cyberrisico is nu een bedrijfsrisico.", "Dezelfde druk die grote ondernemingen met eigen teams opvangen, raakt nu organisaties van elke omvang, meestal zonder de mensen om ermee om te gaan."),
    link: cta("Bekijk waar uw organisatie staat", "/nl/cybersecurity-assessment/"),
    items: [
      { title: "Dreigingen gericht op kleinere bedrijven", description: "Phishing, accountovername, factuurfraude en ransomware zijn juist gericht op organisaties zonder eigen securityteam.", icon: "Crosshair" },
      { title: "Regelgeving die blijft veranderen", description: "NIS2 en de Cyberbeveiligingswet, de AVG en sectorregels leggen de lat hoger voor governance, melding en bewijs.", icon: "Scale" },
      { title: "Geen senior securitykennis in huis", description: "Belangrijke beveiligingsbeslissingen komen terecht bij IT-generalisten of drukke directeuren zonder tijd of achtergrond om het risico te wegen.", icon: "UserX" },
      { title: "Verstoring van de dagelijkse bedrijfsvoering", description: "Eén overgenomen mailbox of versleutelde server kan verkoop, leveringen of zorg dagenlang stilleggen, niet uren.", icon: "Activity" },
      { title: "Risico via leveranciers", description: "IT-leveranciers, cloudplatforms en partners hebben de sleutels van uw omgeving, terwijl uw eigen klanten u op hun beurt bevragen.", icon: "Network" },
      { title: "Onzekere bedrijfscontinuïteit", description: "Er zijn back-ups, maar ze zijn niet getest, en niemand weet precies wie wat beslist als systemen uitvallen.", icon: "LifeBuoy" },
    ],
  },
  services: {
    ...sec("Diensten", "Senior expertise, op maat van uw organisatie.", "Begin met inzicht, bereid u voor op regelgeving en bouw daarna duurzame weerbaarheid met doorlopende sturing en ondersteuning."),
    link: cta("Vergelijk alle diensten", "/nl/services"),
    featuredLabel: "Aanbevolen startpunt", featuredLinkLabel: "Bekijk de Health Check",
    regulationLabel: "Regelgeving · NIS2 / Cbw", regulationDate: "15.08.2026", regulationDateLabel: "Cyberbeveiligingswet van kracht", regulationLinkLabel: "Bereid u voor op NIS2",
  },
  assessment: {
    ...sec("Gratis zelfscan", "Hoe goed is uw bedrijf voorbereid op de cyberdreigingen van nu?", "Ontdek de sterke punten van uw organisatie op het gebied van cybersecurity, breng mogelijke hiaten in kaart en ontvang binnen enkele minuten praktische aanbevelingen."),
    stats: [{ value: "5", label: "scans" }, { value: "7", label: "domeinen" }, { value: "5–12", label: "minuten" }],
    button: cta("Start uw gratis scan", "/nl/cybersecurity-assessment/"),
    note: "Geen account nodig. Uw resultaten direct, zonder contactgegevens achter te laten.",
  },
  why: {
    eyebrow: "Waarom BlazeKonzult", title: "Denkkracht van grote organisaties, op maat van groeiende bedrijven.",
    promise: "Helder advies. Praktische actie. Sterkere weerbaarheid.", promiseLabel: "De belofte van BlazeKonzult",
    items: [
      { title: "Praktische cybersecurity-expertise", description: "Senior, gecertificeerde ervaring in governance, cloud, IT- en OT-risico, toegepast op een schaal die past bij het mkb." },
      { title: "Aanbevelingen vanuit het bedrijf", description: "Bevindingen worden geformuleerd als bedrijfsrisico met een duidelijke eigenaar, kosten en prioriteit, niet als lijst technische fouten." },
      { title: "Opdrachten op maat", description: "Scans met vaste reikwijdte of doorlopende ondersteuning, afgestemd op uw organisatie in plaats van een standaardpakket." },
      { title: "Kennis van Europese regelgeving", description: "Gebaseerd op NIS2, de Cyberbeveiligingswet en de AVG, en op wat uw klanten daardoor van u gaan vragen." },
      { title: "Flexibel securityleiderschap", description: "Met een virtuele CISO krijgt u enkele dagen per maand senior sturing in plaats van een fulltime directiefunctie." },
      { title: "Risicoreductie op de lange termijn", description: "Elke opdracht eindigt met een geprioriteerde roadmap die u kunt volgen, zodat de voortgang doorgaat na het rapport." },
    ],
  },
  method: sec("Zo werken wij", "Een adviesmethode gericht op beslissingen, niet op documenten.", "Elke opdracht doorloopt dezelfde vijf fasen, zodat u altijd weet waar u staat en wat er volgt."),
  industries: { ...sec("Sectoren", "Dezelfde dreigingen raken elke sector anders.", "Waar een bedrijf van afhankelijk is, bepaalt waar het cyberrisico zich concentreert. Kies een sector om te zien wat er verandert."), link: cta("Alle sectoren", "/nl/industries") },
  leadership: {
    eyebrow: "Leiding", title: "Adeiza Johnson Yisa", lead: "Oprichter en principal consultant",
    paragraphs: [
      "Adeiza richtte BlazeKonzult op om kleinere organisaties toegang te geven tot cybersecurity-expertise die meestal alleen grote ondernemingen hebben. Zijn achtergrond omvat cybersecuritygovernance, IT- en OT-risico, cloudbeveiliging, risico's van derden en rapportage over cyberrisico op directieniveau.",
      "Hij werkt rechtstreeks met bestuurders en vertaalt technisch risico naar heldere beslissingen en praktische prioriteiten.",
    ],
    primary: cta("Lees het volledige profiel", "/nl/about"), linkedinLabel: "Verbind op LinkedIn",
  },
  insights: { eyebrow: "Inzichten", title: "Praktische handvatten voor bestuurders.", link: cta("Alle inzichten", "/nl/resources"), featuredLabel: "Update regelgeving" },
  faq: {
    eyebrow: "Veelgestelde vragen", title: "Vragen die bestuurders ons stellen.", note: "Een andere vraag? [Stel hem ons direct](/nl/contact).",
    items: [
      { question: "Hebben we een fulltime CISO nodig?", answer: "Niet per se. Veel kleine en middelgrote organisaties hebben meer aan parttime begeleiding op senior niveau dan aan een fulltime functie. Een virtuele CISO biedt dat leiderschap flexibel, tegen een fractie van de kosten." },
      { question: "Waar beginnen we met een beperkt budget?", answer: "Een Cybersecurity Health Check is meestal het meest praktische startpunt. U krijgt een helder beeld van uw huidige risico's en een geprioriteerd actieplan, zodat u eerst investeert in wat het zwaarst weegt." },
      { question: "Kan BlazeKonzult helpen met NIS2?", answer: "Ja. We helpen organisaties en leveranciers te bepalen of NIS2 of de Cyberbeveiligingswet op hen van toepassing kan zijn, en begeleiden praktische stappen zoals een gap-analyse en governance-aanbevelingen." },
      { question: "Kan BlazeKonzult penetratietesten leveren?", answer: "We werken samen met betrouwbare technische specialisten voor penetratietesten en kwetsbaarheidsscans als onderdeel van een bredere beoordeling, en helpen u de resultaten in zakelijke termen te begrijpen en op te volgen." },
      { question: "Doen jullie ook incidentrespons?", answer: "Wij richten ons op voorbereiding: plannen opstellen, tabletopoefeningen houden en back-ups beoordelen, zodat uw team met vertrouwen kan reageren als er een incident is." },
      { question: "Is de dienstverlening geschikt voor niet-technische ondernemers?", answer: "Ja. Onze aanpak is gemaakt voor bestuurders, niet alleen voor technische teams. We leggen risico's en aanbevelingen uit in gewone zakelijke taal, met duidelijke prioriteiten en vervolgstappen." },
    ],
  },
  closing: closing("Bouw aan een veiliger bedrijf.", "Zet de volgende stap naar sterkere cybersecurity, meer weerbaarheid en gereedheid voor regelgeving.", cta("Plan een adviesgesprek", "/nl/contact"), cta("Neem contact op", "/nl/contact#enquiry")),
};

export const aboutNl = {
  seo: { title: "Over BlazeKonzult en oprichter Adeiza Johnson Yisa", description: "BlazeKonzult maakt senior cybersecurity-expertise toegankelijk voor het Nederlandse mkb. Maak kennis met oprichter Adeiza Johnson Yisa, CISSP, CISM, CCSP, CEH en PMP." },
  hero: { eyebrow: "Over BlazeKonzult", title: "Cybersecurity-ervaring van grote organisaties, toegankelijk gemaakt.", description: "BlazeKonzult helpt Nederlandse mkb-bedrijven cyberrisico te verkleinen, weerbaarder te worden en te voldoen aan groeiende verwachtingen van klanten, toezichthouders en ketenpartners, met praktisch advies op senior niveau." },
  founder: {
    eyebrow: "Oprichter", title: "Een senior adviseur die de taal van het bedrijf spreekt.",
    paragraphs: [
      "Adeiza Johnson Yisa richtte BlazeKonzult op om kleinere organisaties toegang te geven tot cybersecurity-expertise die vaak alleen beschikbaar is voor grote ondernemingen. Zijn achtergrond omvat cybersecuritygovernance, IT- en OT-risico, informatierisicobeheer, cloudbeveiliging, risico's van derden, security-awareness, voorbereiding op incidenten en rapportage over cyberrisico op directieniveau.",
      "Hij adviseerde bestuurders, technologieteams en risico-eigenaren over cyberdreigingen, beveiligingsmaatregelen, verwachtingen van toezichthouders, risicoacceptatie en continuïteitsplanning. Zijn aanpak is praktisch en zakelijk: organisaties helpen hun werkelijke risico's te begrijpen, de belangrijkste maatregelen te prioriteren en vertrouwen op te bouwen bij klanten, leveranciers en toezichthouders.",
    ],
    quote: "Cybersecurity moet bestuurders helderheid en vertrouwen geven, niet meer complexiteit.",
    certificationsLabel: "Professionele certificeringen",
    expertiseLabel: "Expertisegebieden",
    expertise: ["Cybersecuritygovernance", "IT- en OT-risico", "Informatierisicobeheer", "Cloudbeveiliging", "Risico's van derden", "Security-awareness", "Voorbereiding op incidenten", "Rapportage over cyberrisico voor directies"],
  },
  statements: {
    eyebrow: "Wat ons drijft", title: "Helder advies. Praktische actie. Sterkere weerbaarheid.",
    items: [
      { label: "Missie", text: "Professionele cybersecurity toegankelijk, praktisch en betaalbaar maken voor het Nederlandse mkb, zodat bedrijven hun gegevens, bedrijfsvoering, klanten en reputatie kunnen beschermen." },
      { label: "Visie", text: "Een vertrouwde cybersecuritypartner zijn voor het Nederlandse mkb, zodat kleinere organisaties met vertrouwen kunnen werken in een digitale economie waarin cyberweerbaarheid essentieel is voor continuïteit en groei." },
      { label: "Doel", text: "Cybersecurity-ervaring van grote organisaties vertalen naar heldere, uitvoerbare en proportionele verbeteringen voor kleinere bedrijven." },
    ],
  },
  values: {
    eyebrow: "Waarden", title: "Hoe wij willen werken.",
    items: [
      { title: "Helderheid boven complexiteit", text: "Advies moet begrijpelijk zijn, niet intimiderend." },
      { title: "Praktijk boven theorie", text: "Elke aanbeveling is gebaseerd op wat uw bedrijf realistisch kan uitvoeren." },
      { title: "Partnerschap boven transacties", text: "Een adviseur voor de lange termijn, geen eenmalige leverancier." },
    ],
  },
  approach: { eyebrow: "Aanpak", title: "Elke opdracht doorloopt vijf fasen.", button: cta("Plan een gesprek", "/nl/contact") },
  closing: closing("Bespreek uw organisatie met Adeiza.", "Een kort, vrijblijvend adviesgesprek is de snelste manier om te zien waar u kunt beginnen."),
};

export const servicesPageNl = {
  seo: { title: "Cybersecuritydiensten voor het Nederlandse mkb", description: "De cybersecuritydiensten van BlazeKonzult: Health Checks, NIS2-gereedheid, virtuele CISO, Managed Security Essentials, awarenesstraining, voorbereiding op incidenten en leveranciersborging." },
  hero: { eyebrow: "Diensten", title: "Cybersecuritydiensten voor groeiende Nederlandse bedrijven.", description: "Elke opdracht wordt afgestemd op uw organisatie, niet op een standaardchecklist. De diensten zijn ingedeeld naar wat ze u helpen bereiken.", primary: cta("Plan een adviesgesprek", "/nl/contact"), secondary: cta("Twijfelt u? Doe de scan", "/nl/cybersecurity-assessment/") },
  compare: { eyebrow: "Vergelijken", title: "Welke dienst past bij waar u nu staat?", serviceLabel: "Dienst", bestForLabel: "Het meest geschikt voor", outcomeLabel: "Resultaat" },
  closing: closing("Weet u niet waar te beginnen?", "De meeste organisaties beginnen met een Cybersecurity Health Check, of met een gratis zelfscan om te zien waar de hiaten zitten."),
};

export const industriesNl = {
  seo: { title: "Cybersecurity per sector", description: "Hoe cyberrisico verschilt tussen zakelijke dienstverlening, zorg, productie, logistiek, SaaS, IT-dienstverleners en leveranciers van gereguleerde organisaties in Nederland." },
  hero: { eyebrow: "Sectoren", title: "Cyberrisico volgt waar uw bedrijf van afhankelijk is.", description: "Bij een advocatenkantoor zit het risico in de mailbox, bij een fabrikant op de werkvloer. Deze profielen laten zien waar het risico zich per sector concentreert en wat wij als eerste aanpakken." },
  labels: { dependsOn: "Afhankelijk van:", risks: "Waar het risico zit", priorities: "Wat wij prioriteren", regulatory: "Regelgeving.", services: "Relevante diensten" },
  notListed: { text: "Staat uw sector er niet bij, of is uw bedrijf in meerdere sectoren actief?", button: cta("Vertel ons over uw organisatie", "/nl/contact") },
  closing: closing("Advies dat past bij uw sector.", "Plan een adviesgesprek; we beginnen bij waar uw bedrijf van afhankelijk is."),
  items: [
    { slug: "professional-services", name: "Zakelijke dienstverlening", icon: "Briefcase", summary: "Advocaten, accountants, adviseurs en consultants beheren vertrouwelijke klantinformatie en verplaatsen geld namens klanten, waardoor ze een geliefd doelwit zijn voor e-mailfraude.", dependsOn: "E-mail, documentbeheer en klantportalen", challenges: ["Business email compromise en valse betaalinstructies", "Vertrouwelijke klantdossiers verspreid over e-mail, cloudopslag en laptops", "Klanten die bij de start om beveiligingsgaranties vragen"], priorities: ["Multifactorauthenticatie en monitoring van mailboxen", "Een duidelijke controleprocedure bij gewijzigde betaalgegevens", "Gecontroleerd delen en bewaren van documenten"], regulatory: "De AVG geldt voor vrijwel alle klantgegevens; beroepsgeheim maakt de gevolgen van een lek groter.", services: ["cybersecurity-health-check", "security-awareness-training", "virtual-ciso"] },
    { slug: "healthcare-healthtech", name: "Zorg en healthtech", icon: "HeartPulse", summary: "Klinieken, zorgaanbieders en de softwarebedrijven die hen bedienen verwerken bijzondere gezondheidsgegevens en ondersteunen processen waarbij uitval mensen direct raakt.", dependsOn: "Patiëntdossiers, klinische software en verbonden apparatuur", challenges: ["Gezondheidsgegevens zijn een bijzondere categorie onder de AVG", "Zorgkritische systemen met weinig ruimte voor uitval", "Ziekenhuizen en zorggroepen die gedetailleerde leveranciersborging eisen"], priorities: ["Strikte toegangscontrole en logging op patiëntgegevens", "Geteste herstelprocedures voor zorgkritische systemen", "Bewijsdossiers afgestemd op NEN 7510"], regulatory: "De zorg is een NIS2-sector; Nederlandse zorginkopers verwijzen voor informatiebeveiliging vaak naar NEN 7510.", services: ["nis2-readiness", "supplier-security-assurance", "incident-response-readiness"] },
    { slug: "manufacturing", name: "Productie", icon: "Factory", summary: "Productieomgevingen verbinden machines steeds vaker met kantoornetwerken en de cloud, vaak met oudere software die niet zomaar kan worden bijgewerkt.", dependsOn: "Productielijnen, OT-netwerken en toegang op afstand door machineleveranciers", challenges: ["Operationele technologie die niet als kantoor-IT kan worden bijgewerkt", "Onderhoudstoegang op afstand in handen van machineleveranciers", "Een besmetting op kantoor die zich verspreidt naar de productievloer"], priorities: ["Scheiding tussen kantoor-IT en productienetwerken", "Gecontroleerde, gelogde toegang op afstand voor leveranciers", "Herstelplannen voor machineconfiguraties en productiegegevens"], regulatory: "Diverse productiesectoren vallen onder NIS2 als belangrijke entiteit.", services: ["cybersecurity-health-check", "nis2-readiness", "incident-response-readiness"] },
    { slug: "logistics-transport", name: "Logistiek en transport", icon: "Truck", summary: "Logistieke bedrijven draaien op nauw verbonden platforms die worden gedeeld met verladers, vervoerders en douane, dus een storing merkt u direct aan gemiste leveringen.", dependsOn: "Transport- en magazijnsystemen, gegevensuitwisseling met partners", challenges: ["Omgeleide facturen en betalingsfraude via veel tegenpartijen", "Afhankelijkheid van partnerportalen en koppelingen", "Bedrijfsvoering die stilvalt als planningssystemen uitvallen"], priorities: ["Sterke authenticatie op portalen en partnertoegang", "Handmatige uitwijkprocedures voor storingen van meerdere dagen", "Risico's van leveranciers en koppelingen in kaart"], regulatory: "Transport is een NIS2-sector; grote verladers leggen beveiligingseisen steeds vaker door in de keten.", services: ["nis2-readiness", "incident-response-readiness", "supplier-security-assurance"] },
    { slug: "saas-data", name: "SaaS- en databedrijven", icon: "Cloud", summary: "Software- en databedrijven verkopen vertrouwen net zo goed als functionaliteit: zakelijke klanten verwachten volwassen cloudbeveiliging voordat ze tekenen.", dependsOn: "Cloudinfrastructuur, ontwikkelstraten en klantgegevens", challenges: ["Lange beveiligingsvragenlijsten die zakelijke deals ophouden", "Verkeerd ingestelde cloud en te ruime rechten", "Klantgegevens verspreid over tools en omgevingen"], priorities: ["Een herbruikbaar borgings- en bewijsdossier", "Minimale cloudrechten en beheer van secrets", "Een geloofwaardige roadmap richting ISO/IEC 27001 waar klanten dat verwachten"], regulatory: "Klantcontracten en verplichtingen als verwerker onder de AVG bepalen vaak de beveiligingslat, nog vóór regelgeving dat doet.", services: ["supplier-security-assurance", "virtual-ciso", "managed-security"] },
    { slug: "it-msp", name: "IT- en managed service providers", icon: "Server", summary: "Dienstverleners met beheertoegang tot veel klantomgevingen zijn een waardevol doelwit: één inbraak kan elke klant bereiken.", dependsOn: "Beheertools op afstand en geprivilegieerde toegang bij klanten", challenges: ["Geprivilegieerde toegang tot meerdere klantomgevingen", "Klanten en hun toezichthouders die om bewijs van maatregelen vragen", "Dienstverlening in balans brengen met interne beveiligingsdiscipline"], priorities: ["Geharde beheertoegang op afstand en geprivilegieerde accounts", "Een vastgelegde procedure om klanten over incidenten te informeren", "Onafhankelijk toezicht op uw eigen beveiliging"], regulatory: "Managed service providers worden in NIS2 expliciet genoemd binnen ICT-dienstenbeheer.", services: ["virtual-ciso", "nis2-readiness", "managed-security"] },
    { slug: "regulated-suppliers", name: "Leveranciers van gereguleerde organisaties", icon: "Link2", summary: "Kleinere bedrijven die energie-, zorg-, overheids- of financiële organisaties beleveren, krijgen via contracten en audits te maken met de verplichtingen van hun klanten.", dependsOn: "Klantcontracten, gedeelde gegevens en systeemkoppelingen", challenges: ["Beveiligingsclausules en meldplichten bij incidenten in contracten", "Vragenlijsten en audits zonder eigen expertise om ze te beantwoorden", "Het risico aanbestedingen te verliezen op beveiliging"], priorities: ["Basismaatregelen vastgelegd en aantoonbaar", "Een korte, geteste procedure voor het melden van incidenten", "Een eigenaar voor beveiliging op managementniveau"], regulatory: "Organisaties onder NIS2 moeten ketenrisico's beheersen, dus hun verwachtingen komen bij u terecht.", services: ["supplier-security-assurance", "nis2-readiness", "cybersecurity-health-check"] },
  ],
};

export const resourcesNl = {
  seo: { title: "Cybersecurity-inzichten", description: "Praktisch cybersecurityadvies voor het Nederlandse mkb: artikelen over NIS2-gereedheid, phishing, Microsoft 365-beveiliging, voorbereiding op incidenten en meer." },
  hero: { eyebrow: "Inzichten", title: "Praktisch cybersecurityadvies voor bestuurders.", description: "Heldere artikelen zonder jargon over regelgeving, risico en weerbaarheid, geschreven voor de mensen die in het mkb de beslissingen nemen." },
  featuredSlug: "",
  featuredLabel: "Uitgelicht · Update regelgeving",
  checklists: {
    ...sec("Checklists", "Gratis praktische checklists.", "Vraag een checklist aan en wij sturen hem naar uw inbox."),
    items: [
      { name: "Cyber Resilience Checklist", title: "Checklist cyberweerbaarheid voor het Nederlandse mkb", text: "De basismaatregelen die elk groeiend bedrijf op orde zou moeten hebben.", buttonLabel: "Vraag de gratis checklist aan" },
      { name: "NIS2 Supplier Readiness Checklist", title: "NIS2-checklist voor leveranciers", text: "Wat leveranciers moeten voorbereiden nu klanten reageren op NIS2 en de Cyberbeveiligingswet.", buttonLabel: "Vraag de leverancierschecklist aan" },
    ],
  },
  newsletter: { title: "Ontvang nieuwe inzichten per e-mail.", text: "Af en toe praktisch advies. Geen spam, altijd afmelden." },
  article: {
    nextStepLabel: "Volgende stap", nextStepTitle: "Bekijk waar uw organisatie staat.", nextStepText: "De gratis gereedheidsscan duurt ongeveer vijf tot tien minuten.", nextStepLink: cta("Start de scan", "/nl/cybersecurity-assessment/"),
    backLabel: "Alle inzichten", relatedEyebrow: "Verder lezen", relatedTitle: "Gerelateerde inzichten",
    closing: closing("Advies op maat?", "Een Cybersecurity Health Check geeft u een helder beeld van uw belangrijkste risico's en een praktisch plan."),
  },
};

export const contactNl = {
  seo: { title: "Contact en adviesgesprek", description: "Plan een gratis adviesgesprek met BlazeKonzult, vraag een Cybersecurity Health Check aan of bespreek NIS2-gereedheid en ondersteuning door een virtuele CISO." },
  hero: { eyebrow: "Plan een adviesgesprek", title: "Laten we het hebben over de cybersecurity van uw organisatie.", description: "Vertel ons kort over uw organisatie en wat u ertoe bracht contact op te nemen. Wij reageren, meestal binnen één werkdag." },
  form: { title: "Uw aanvraag", note: "Velden met * zijn verplicht." },
  next: {
    title: "Wat gebeurt er daarna",
    items: [
      { title: "Reactie binnen één werkdag", text: "Een senior consultant leest elke aanvraag persoonlijk." },
      { title: "Een kort adviesgesprek", text: "We bespreken uw situatie en wat echt zou helpen, vrijblijvend." },
      { title: "Een helder voorstel", text: "Als er een match is, ontvangt u een voorstel met reikwijdte en planning." },
    ],
  },
  linkedinLabel: "Stuur Adeiza een bericht op LinkedIn",
  assessmentBox: { eyebrow: "Nog niet klaar voor een gesprek?", text: "Doe eerst de gratis gereedheidsscan en zie waar uw organisatie staat.", link: cta("Start de scan", "/nl/cybersecurity-assessment/") },
  privacyNote: "Uw gegevens worden alleen gebruikt om op uw aanvraag te reageren, zoals beschreven in onze [privacyverklaring](/nl/privacy-policy). Wij verkopen of delen uw gegevens nooit voor marketing.",
};

const s = (heading: string, paragraphs: string[], bullets: string[] = []) => ({ heading, paragraphs, bullets });

export const privacyNl = {
  seo: { title: "Privacyverklaring", description: "Hoe BlazeKonzult persoonsgegevens verzamelt, gebruikt en beschermt, in lijn met de AVG." },
  title: "Privacyverklaring", intro: "Laatst bijgewerkt: 24 november 2026", notice: "",
  sections: [
    s("1. Wie wij zijn", ["BlazeKonzult (“wij”, “onze”) is een cybersecurityadviesbureau, opgericht door Adeiza Johnson Yisa, voor bedrijven in Nederland. Wij zijn de verwerkingsverantwoordelijke voor persoonsgegevens die via deze website worden verzameld."]),
    s("2. Welke gegevens wij verzamelen", ["Wij verzamelen alleen de gegevens die u zelf via de formulieren op deze website invult: uw naam, bedrijf, zakelijk e-mailadres en, als u die opgeeft, uw telefoonnummer, functie, bedrijfsgrootte, sector, de ondersteuning waarin u geïnteresseerd bent en de inhoud van uw bericht. Voor de nieuwsbrief verzamelen wij alleen uw e-mailadres. Wij gebruiken geen analyse-, advertentie- of trackingtools."]),
    s("3. De cybersecurity-gereedheidsscan", [
      "U kunt de scan invullen en uw resultaten bekijken zonder contactgegevens op te geven. Uw antwoorden worden alleen gebruikt om uw resultaten te berekenen. Ze worden versleuteld opgeslagen, samen met algemene profielantwoorden zoals bedrijfsgrootte, sector en land, die wij geanonimiseerd gebruiken om de scan te verbeteren. Wij vragen nooit om wachtwoorden, IP-adressen, netwerktekeningen of andere gevoelige technische details.",
      "Tijdens het invullen wordt uw voortgang alleen in uw eigen browser (local storage) bewaard, zodat u later verder kunt gaan. Na het versturen wordt die verwijderd.",
      "Als u het pdf-rapport of een adviesgesprek aanvraagt, bewaren wij de contactgegevens die u opgeeft, gekoppeld aan uw resultaten, zodat wij het rapport kunnen sturen en het gesprek kunnen voorbereiden. Downloadlinks voor rapporten zijn persoonlijk en verlopen na 14 dagen. Marketingmails ontvangt u alleen als u daar apart toestemming voor geeft.",
      "Anonieme scanresultaten worden na 12 maanden verwijderd. Contactgegevens uit scans en websiteaanvragen worden na 24 maanden verwijderd, tenzij u klant wordt. U kunt ons altijd vragen om een kopie van uw gegevens of om verwijdering.",
    ]),
    s("4. Hoe en waarom wij uw gegevens gebruiken", ["Wij gebruiken uw gegevens om op uw aanvraag te reageren, om u een aangevraagd rapport of checklist te sturen en, als u zich heeft aangemeld of toestemming heeft gegeven, om u af en toe cybersecurityadvies te sturen. De grondslag is uw toestemming en, als u ons vraagt naar onze diensten, de stappen die nodig zijn voordat wij een overeenkomst met u aangaan (AVG artikel 6, lid 1, onder a en b). Wij verkopen uw gegevens nooit en delen ze niet voor marketingdoeleinden."]),
    s("5. Waar uw gegevens worden verwerkt", ["Gegevens worden verwerkt en opgeslagen door onze hostingprovider in de Europese Unie. Contactgegevens en scanantwoorden worden versleuteld in onze database opgeslagen. Onze hosting- en e-mailproviders handelen namens ons en verwerken uw gegevens alleen om hun dienst aan ons te leveren."]),
    s("6. Uw rechten", ["Onder de AVG heeft u het recht op inzage, correctie of verwijdering van uw persoonsgegevens, op beperking van of bezwaar tegen de verwerking, op gegevensoverdraagbaarheid en om uw toestemming op elk moment in te trekken. Neem hiervoor contact met ons op via onze [contactpagina](/nl/contact/). U heeft ook het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens."]),
    s("7. Beveiliging van gegevens", ["Wij nemen passende technische en organisatorische maatregelen om persoonsgegevens te beschermen, waaronder versleutelde (HTTPS-)verbindingen, versleuteling van opgeslagen contactgegevens en scanantwoorden, spambescherming op formulieren en beperkte, gelogde toegang tot ons beheersysteem."]),
    s("8. Contact", ["Voor vragen over privacy kunt u contact opnemen via onze [contactpagina](/nl/contact/)."]),
  ],
};

export const cookieNl = {
  seo: { title: "Cookiebeleid", description: "Hoe BlazeKonzult cookies en vergelijkbare technieken op deze website gebruikt." },
  title: "Cookiebeleid", intro: "Laatst bijgewerkt: 24 november 2026", notice: "",
  sections: [
    s("1. Wat zijn cookies", ["Cookies zijn kleine tekstbestanden die een website op uw apparaat plaatst. Ze worden vaak gebruikt om voorkeuren te onthouden of om bij te houden hoe bezoekers een site gebruiken."]),
    s("2. Cookies op deze website", ["Deze website plaatst geen cookies bij bezoekers. Wij gebruiken geen analyse-, advertentie- of trackingtools en laden geen inhoud van sociale media die eigen cookies plaatst. De enige cookie die wij gebruiken is een strikt noodzakelijke inlogcookie voor onze eigen medewerkers op de beheerpagina's."]),
    s("3. Local storage", ["Als u de gereedheidsscan invult, wordt uw voortgang in de local storage van uw browser bewaard, zodat u verder kunt waar u was gebleven. Die gegevens verlaten uw apparaat pas als u de scan verstuurt en worden daarna verwijderd. Uw taalkeuze wordt niet opgeslagen; die volgt uit het webadres."]),
    s("4. Lettertypen en inhoud van derden", ["Alle lettertypen en afbeeldingen op deze website komen van onze eigen webserver, dus een bezoek stuurt geen gegevens naar lettertype- of contentproviders. Links naar LinkedIn openen de website van LinkedIn zelf, waarop het cookiebeleid van LinkedIn van toepassing is."]),
    s("5. Wijzigingen in dit beleid", ["Als wij in de toekomst cookies of analysetools gaan gebruiken, passen wij dit beleid aan en vragen wij waar nodig uw toestemming voordat niet-noodzakelijke cookies worden geplaatst."]),
    s("6. Contact", ["Vragen over dit beleid kunt u stellen via onze [contactpagina](/nl/contact/)."]),
  ],
};

export const disclosureNl = {
  seo: { title: "Responsible disclosure", description: "Hoe u een kwetsbaarheid in de website of systemen van BlazeKonzult kunt melden." },
  title: "Responsible disclosure",
  intro: "Als cybersecurityorganisatie nemen wij de beveiliging van onze eigen systemen serieus en verwelkomen wij verantwoorde meldingen uit de securitygemeenschap.",
  notice: "Denkt u een kwetsbaarheid in onze website of systemen te hebben gevonden? Meld die dan op een verantwoorde manier, volgens de richtlijnen hieronder.",
  sections: [
    s("Wat wij vragen", [], ["Meld het probleem snel en vertrouwelijk, zonder het eerst openbaar te maken.", "Geef voldoende details zodat wij het probleem kunnen reproduceren en begrijpen.", "Bekijk, wijzig of verwijder geen gegevens die niet van u zijn.", "Voer geen tests uit die onze diensten kunnen verstoren of andere gebruikers raken."]),
    s("Hoe u meldt", ["Stuur uw melding via onze [contactpagina](/nl/contact/) met zoveel mogelijk details."]),
    s("Wat u van ons kunt verwachten", ["Wij bevestigen meldingen zo snel mogelijk, onderzoeken ze te goeder trouw en houden u op de hoogte tot het probleem is opgelost."]),
  ],
};
