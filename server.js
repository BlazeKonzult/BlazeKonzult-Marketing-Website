/**
 * BlazeKonzult production/dev server: one Node process serving the website (Next.js),
 * the assessment + admin API (/api) and uploaded images (/media).
 * cPanel "Setup Node.js App": Application startup file = server.js
 *   node server.js          production (needs `npm run build` first)
 *   NEXT_DEV=true node server.js   development with hot reload (local only)
 */
// Development mode only when explicitly requested with NEXT_DEV=true, and never when NODE_ENV=production.
// Hosting always runs the webpack-compiled .next build (npm start = node server.js).
const dev = process.env.NEXT_DEV === "true" && process.env.NODE_ENV !== "production";
if (!process.env.NODE_ENV) process.env.NODE_ENV = dev ? "development" : "production";

const { loadConfig } = require("./backend/dist/config");
const cfg = loadConfig();
// Share the database settings with the website's content loader (same process).
process.env.BK_DB_JSON = JSON.stringify({ host: cfg.db.host, port: cfg.db.port, database: cfg.db.name, user: cfg.db.user, password: cfg.db.pass });

const next = require("next");
const site = next({ dev, dir: __dirname });
const handle = site.getRequestHandler();

// Start serving straight away; database setup runs alongside so a slow or unreachable
// database can never stop the site from starting. Setup is idempotent: it updates the schema,
// installs starter content on a new database and creates the first owner from BK_* variables.
console.log(`[blazekonzult] email: ${cfg.mail.driver === "smtp" && cfg.mail.smtp ? `smtp via ${cfg.mail.smtp.host}:${cfg.mail.smtp.port} (secure=${cfg.mail.smtp.secure}) as ${cfg.mail.smtp.user || "(no user)"}, from ${cfg.mail.from}` : cfg.mail.driver === "smtp" ? "smtp selected but SMTP_HOST is missing, so sendmail is used" : cfg.mail.driver}`);
console.log(`[blazekonzult] database: ${cfg.db.user || "(no user)"}@${cfg.db.host}:${cfg.db.port}/${cfg.db.name || "(no name)"}`);
require("./backend/dist/bootstrap").bootstrap((m) => console.log(`[blazekonzult] ${m}`))
  .catch((e) => console.error(`[blazekonzult] database setup failed: ${e.code ?? ""} ${e.message}`));

site.prepare().then(() => {
  const { createApp } = require("./backend/dist/app");
  const app = createApp({ site: (req, res) => handle(req, res) });
  const port = process.env.PORT || cfg.port || 3000;
  const server = app.listen(port, () => console.log(`[blazekonzult] ${dev ? "development" : "production"} server on ${port}`));
  const stop = () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 5000).unref(); };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}).catch((e) => { console.error(e); process.exit(1); });

