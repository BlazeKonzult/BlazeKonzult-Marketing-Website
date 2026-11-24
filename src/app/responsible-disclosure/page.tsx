import LegalPage, { legalMetadata } from "@/components/LegalPage";

export const generateMetadata = () => legalMetadata("responsible-disclosure");

export default function Page() {
  return <LegalPage slug="responsible-disclosure" />;
}
