import { permanentRedirect } from "next/navigation";

// The assessment moved to /cybersecurity-assessment/.
export default function Page() {
  permanentRedirect("/cybersecurity-assessment/");
}
