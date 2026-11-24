// Production domain. Set NEXT_PUBLIC_SITE_URL at build time, e.g.
//   NEXT_PUBLIC_SITE_URL=https://blazekonzult.nl npm run build
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://blazekonzult.nl").replace(/\/$/, "");
