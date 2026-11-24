import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BlazeKonzult", short_name: "BlazeKonzult", start_url: "/", display: "browser",
    background_color: "#081421", theme_color: "#081421",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
