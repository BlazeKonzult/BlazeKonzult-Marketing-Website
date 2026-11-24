import ServicePage, { serviceMetadata } from "@/components/ServicePage";

export const generateMetadata = () => serviceMetadata("incident-response-readiness");

export default function Page() {
  return <ServicePage slug="incident-response-readiness" />;
}
