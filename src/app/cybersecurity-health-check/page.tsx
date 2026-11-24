import ServicePage, { serviceMetadata } from "@/components/ServicePage";

export const generateMetadata = () => serviceMetadata("cybersecurity-health-check");

export default function Page() {
  return <ServicePage slug="cybersecurity-health-check" />;
}
