import ServicePage, { serviceMetadata } from "@/components/ServicePage";

export const generateMetadata = () => serviceMetadata("nis2-readiness");

export default function Page() {
  return <ServicePage slug="nis2-readiness" />;
}
