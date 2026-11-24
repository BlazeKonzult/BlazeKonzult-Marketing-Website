import ServicePage, { serviceMetadata } from "@/components/ServicePage";

export const generateMetadata = () => serviceMetadata("supplier-security-assurance");

export default function Page() {
  return <ServicePage slug="supplier-security-assurance" />;
}
