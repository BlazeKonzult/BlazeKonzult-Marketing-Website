/** Server-side strings for engine labels, emails and PDF reports (English + Dutch). */
export type Loc = 'en' | 'nl';
export type LStr = { en: string; nl?: string };

export const pick = (v: LStr | string | null | undefined, l: Loc): string => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return (v[l] && v[l] !== '' ? v[l] : v.en) ?? '';
};

export const SCALE: LStr[] = [
  { en: 'Not implemented', nl: 'Niet geïmplementeerd' },
  { en: 'Informal or inconsistent', nl: 'Informeel of inconsistent' },
  { en: 'Partially implemented', nl: 'Gedeeltelijk geïmplementeerd' },
  { en: 'Mostly implemented', nl: 'Grotendeels geïmplementeerd' },
  { en: 'Fully implemented and regularly reviewed', nl: 'Volledig geïmplementeerd en regelmatig herzien' },
];

export const SPECIAL = {
  na: { en: 'Not applicable', nl: 'Niet van toepassing' },
  unsure: { en: 'Not sure', nl: 'Weet ik niet' },
};

export const PRIORITY: Record<string, LStr> = {
  critical: { en: 'Critical', nl: 'Kritiek' },
  high: { en: 'High', nl: 'Hoog' },
  medium: { en: 'Medium', nl: 'Gemiddeld' },
  low: { en: 'Low', nl: 'Laag' },
};

export const SERVICES: Record<string, LStr> = {
  'cybersecurity-health-check': { en: 'Cybersecurity Health Check', nl: 'Cybersecurity Health Check' },
  'nis2-readiness': { en: 'NIS2 Readiness', nl: 'NIS2-gereedheid' },
  'virtual-ciso': { en: 'Virtual CISO', nl: 'Virtuele CISO' },
  'managed-security': { en: 'Managed Security Essentials', nl: 'Managed Security Essentials' },
  'security-awareness-training': { en: 'Security Awareness Training', nl: 'Security-awarenesstraining' },
  'incident-response-readiness': { en: 'Incident Response Readiness', nl: 'Incidentresponsgereedheid' },
  'supplier-security-assurance': { en: 'Supplier Security Assurance', nl: 'Supplier Security Assurance' },
};

const S: Record<string, LStr> = {
  report_title: { en: 'Cybersecurity Readiness Report', nl: 'Rapport cybersecuritygereedheid' },
  prepared_for: { en: 'Prepared for', nl: 'Opgesteld voor' },
  assessment: { en: 'Assessment', nl: 'Assessment' },
  version: { en: 'Version', nl: 'Versie' },
  date: { en: 'Date', nl: 'Datum' },
  reference: { en: 'Reference', nl: 'Referentie' },
  overall: { en: 'Overall maturity', nl: 'Totale volwassenheid' },
  coverage: { en: 'Coverage', nl: 'Dekking' },
  uncertainty: { en: 'Answered "Not sure"', nl: 'Beantwoord met "Weet ik niet"' },
  coverage_note: { en: 'Coverage is the share of applicable questions answered with a definite answer.', nl: 'Dekking is het aandeel toepasselijke vragen dat met een duidelijk antwoord is beantwoord.' },
  category_scores: { en: 'Scores by domain', nl: 'Scores per domein' },
  not_assessed: { en: 'Not assessed', nl: 'Niet beoordeeld' },
  critical_findings: { en: 'Critical findings', nl: 'Kritieke bevindingen' },
  critical_intro: { en: 'These controls were reported as missing or uncertain. They are listed separately because a good overall average can hide them.', nl: 'Deze maatregelen zijn als ontbrekend of onzeker gerapporteerd. Ze staan apart vermeld omdat een goed gemiddelde ze kan verbergen.' },
  no_critical: { en: 'No critical control gaps were identified from your answers.', nl: 'Op basis van uw antwoorden zijn geen kritieke hiaten vastgesteld.' },
  strengths: { en: 'Key strengths', nl: 'Belangrijkste sterke punten' },
  no_strengths: { en: 'No domain reached the strength threshold yet.', nl: 'Nog geen domein heeft de drempel voor een sterk punt bereikt.' },
  recommendations: { en: 'Prioritised recommendations', nl: 'Geprioriteerde aanbevelingen' },
  no_recommendations: { en: 'Your answers did not trigger any recommendations.', nl: 'Uw antwoorden leidden niet tot aanbevelingen.' },
  impact: { en: 'Business impact', nl: 'Impact op de organisatie' },
  remediation: { en: 'Suggested remediation', nl: 'Voorgestelde aanpak' },
  timeframe: { en: 'Timeframe', nl: 'Termijn' },
  priority: { en: 'Priority', nl: 'Prioriteit' },
  next_steps: { en: 'Suggested next steps', nl: 'Voorgestelde vervolgstappen' },
  next_1: { en: 'Address the critical findings first, starting with those marked Critical.', nl: 'Pak eerst de kritieke bevindingen aan, te beginnen met de bevindingen gemarkeerd als Kritiek.' },
  next_2: { en: 'Resolve "Not sure" answers: uncertainty about a control is itself a risk.', nl: 'Los antwoorden met "Weet ik niet" op: onzekerheid over een maatregel is zelf een risico.' },
  next_3: { en: 'Turn the recommendations into a 90-day plan with named owners.', nl: 'Zet de aanbevelingen om in een 90-dagenplan met benoemde eigenaren.' },
  next_4: { en: 'Repeat this assessment after changes to measure progress.', nl: 'Herhaal dit assessment na wijzigingen om de voortgang te meten.' },
  services: { en: 'Relevant BlazeKonzult services', nl: 'Relevante diensten van BlazeKonzult' },
  limitations: { en: 'Limitations', nl: 'Beperkingen' },
  limitations_text: {
    en: 'This is a preliminary self-assessment based solely on the answers provided. It is not an audit, a penetration test or a certification, and it does not determine compliance with NIS2, the Dutch Cybersecurity Act (Cbw), GDPR or any other regulation. Maturity scores describe the presence of controls; they are not an estimate of the probability of a breach, and a high score does not guarantee security.',
    nl: 'Dit is een voorlopige zelfbeoordeling, uitsluitend gebaseerd op de gegeven antwoorden. Het is geen audit, penetratietest of certificering en stelt niet vast of u voldoet aan NIS2, de Cyberbeveiligingswet (Cbw), de AVG of andere regelgeving. Volwassenheidsscores beschrijven de aanwezigheid van maatregelen; ze zijn geen schatting van de kans op een inbreuk en een hoge score garandeert geen veiligheid.',
  },
  privacy: { en: 'Privacy', nl: 'Privacy' },
  privacy_text: {
    en: 'Your answers are stored encrypted and are only accessible to authorised BlazeKonzult staff. They are not shared with third parties or AI services. See blazekonzult.nl/privacy-policy for details and your rights.',
    nl: 'Uw antwoorden worden versleuteld opgeslagen en zijn alleen toegankelijk voor bevoegde medewerkers van BlazeKonzult. Ze worden niet gedeeld met derden of AI-diensten. Zie blazekonzult.nl/privacy-policy voor details en uw rechten.',
  },
  contact: { en: 'Contact', nl: 'Contact' },
  page: { en: 'Page', nl: 'Pagina' },
  confidential: { en: 'Confidential', nl: 'Vertrouwelijk' },
  company_size: { en: 'Company size', nl: 'Omvang' },
  industry: { en: 'Industry', nl: 'Sector' },
  country: { en: 'Country', nl: 'Land' },
  email_greeting: { en: 'Hello {0},', nl: 'Beste {0},' },
  email_report_subject: { en: 'Your cybersecurity readiness report', nl: 'Uw rapport cybersecuritygereedheid' },
  email_report_body: { en: 'Thank you for completing the BlazeKonzult cybersecurity readiness assessment. Your personalised PDF report is ready to download using the secure link below.', nl: 'Bedankt voor het invullen van het cybersecuritygereedheidsassessment van BlazeKonzult. Uw persoonlijke PDF-rapport staat klaar en kunt u downloaden via de beveiligde link hieronder.' },
  email_report_button: { en: 'Download your report', nl: 'Download uw rapport' },
  email_report_expiry: { en: 'For your security, this link expires on {0} and the report is generated only when you open it. Please do not forward this email.', nl: 'Voor uw veiligheid verloopt deze link op {0} en wordt het rapport pas gemaakt wanneer u het opent. Stuur deze e-mail niet door.' },
  email_confirm_subject: { en: 'We received your assessment', nl: 'Wij hebben uw assessment ontvangen' },
  email_confirm_body: { en: 'Thank you for completing the BlazeKonzult cybersecurity readiness assessment and sharing your details. We have received your request.', nl: 'Bedankt voor het invullen van het cybersecuritygereedheidsassessment van BlazeKonzult en het delen van uw gegevens. Wij hebben uw verzoek ontvangen.' },
  email_consult_subject: { en: 'Your consultation request', nl: 'Uw aanvraag voor een adviesgesprek' },
  email_consult_body: { en: 'Thank you for requesting a free discovery consultation. We will contact you within one business day using your preferred contact method to arrange a time.', nl: 'Bedankt voor uw aanvraag voor een gratis kennismakingsgesprek. Wij nemen binnen één werkdag contact met u op via uw voorkeurscontactmethode om een tijdstip af te spreken.' },
  email_signoff: { en: 'Kind regards,', nl: 'Met vriendelijke groet,' },
  email_footer: { en: 'You receive this email because you requested it on blazekonzult.nl. We do not send promotional follow-ups unless you opted in.', nl: 'U ontvangt deze e-mail omdat u hierom heeft gevraagd op blazekonzult.nl. Wij sturen geen promotionele berichten tenzij u daarvoor toestemming heeft gegeven.' },
};

export function t(key: string, l: Loc, ...args: string[]): string {
  let s = pick(S[key] ?? { en: key }, l);
  args.forEach((a, i) => { s = s.replace(`{${i}}`, a); });
  return s;
}

export function fmtDate(ts: string, l: Loc): string {
  const d = new Date(ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z');
  const m = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    nl: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  };
  return `${d.getUTCDate()} ${m[l][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
