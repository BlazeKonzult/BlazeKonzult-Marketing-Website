import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = { title: "Command Centre", robots: { index: false, follow: false, nocache: true } };

// Apply the saved light/dark theme before the first paint (no flash of the wrong theme).
const themeScript = `try{var t=localStorage.getItem("bk-admin-theme")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.adminTheme=d?"dark":"light"}catch(e){}`;

export default function Page() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <AdminApp />
    </>
  );
}
