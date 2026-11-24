import { createApp } from './app';
import { loadConfig } from './config';
import { closePool } from './db';

const cfg = loadConfig();
const app = createApp();
// Passenger (cPanel) provides its own PORT/socket; locally we listen on PORT (default 3001).
const server = app.listen(process.env.PORT ?? cfg.port, () => {
  if (cfg.env !== 'test') console.log(`[api] listening on ${process.env.PORT ?? cfg.port} (${cfg.env})`);
});
const stop = () => { server.close(() => { closePool().finally(() => process.exit(0)); }); setTimeout(() => process.exit(0), 5000).unref(); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
