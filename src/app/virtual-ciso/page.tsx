import ServicePage, { serviceMetadata } from "@/components/ServicePage";

export const generateMetadata = () => serviceMetadata("virtual-ciso");

export default function Page() {
  return <ServicePage slug="virtual-ciso" />;
}
