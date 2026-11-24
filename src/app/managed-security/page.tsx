import ServicePage, { serviceMetadata } from "@/components/ServicePage";

export const generateMetadata = () => serviceMetadata("managed-security");

export default function Page() {
  return <ServicePage slug="managed-security" />;
}
