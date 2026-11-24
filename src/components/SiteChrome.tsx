"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/** Marketing header/footer everywhere except the admin dashboard. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  if (path.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
