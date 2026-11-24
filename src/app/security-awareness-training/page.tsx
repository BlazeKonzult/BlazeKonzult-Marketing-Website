import ServicePage, { serviceMetadata } from "@/components/ServicePage";

export const generateMetadata = () => serviceMetadata("security-awareness-training");

export default function Page() {
  return <ServicePage slug="security-awareness-training" />;
}
