import express, { NextFunction, Request, Response } from 'express';
import { loadConfig } from './config';
import { ApiError } from './http';
import { publicRouter } from './routes/public';
import { adminRouter } from './routes/admin';
import { mediaFileHandler } from './media';
import { Mailer } from './mailer';
import { runRetention } from './analytics';
import { redirectMiddleware } from './redirects';

type Handler = (req: Request, res: Response) => unknown;

/**
 * One Express app for the whole site: /api (assessment + admin API), /media (uploaded images)
 * and, when a Next.js request handler is passed, every other path is rendered by Next.js.
 */
export function createApp(opts: { site?: Handler } = {}) {
  const cfg = loadConfig();
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', cfg.trustProxy ? 1 : false);
  app.set('etag', false);

  // Headers for every response
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN', // the admin previews pages in a same-origin frame; the API also sends frame-ancestors 'none'
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    if (cfg.env === 'production') res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  /* ------------------------------- API ------------------------------- */
  const api = express.Router();
  api.use((req, res, next) => {
    res.set({ 'Cross-Origin-Resource-Policy': 'same-origin', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' });
    if (!res.get('Cache-Control')) res.set('Cache-Control', 'no-store');
    // Same-origin API: reject cross-site state-changing requests (defence in depth next to SameSite + CSRF tokens)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const origin = req.get('origin');
      const allowed = [cfg.siteUrl, cfg.siteUrl.replace('://', '://www.')];
      if (cfg.env !== 'production') allowed.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001');
      // Same-origin requests are always fine (also covers the host's preview address); anything else must be the site URL.
      let sameHost = false; try { sameHost = !!origin && new URL(origin).hostname === req.hostname; } catch { /* malformed origin */ }
      if (origin && !sameHost && !allowed.includes(origin)) return next(new ApiError('Cross-origin request blocked.', 'forbidden', 403));
      const isUpload = req.path === '/admin/media' && req.method === 'POST';
      if (!isUpload && !req.is('application/json') && req.headers['content-length'] !== '0' && req.headers['content-length']) return next(new ApiError('Expected JSON.', 'unsupported_media_type', 415));
    }
    next();
  });
  api.use(express.json({ limit: '1mb', strict: true }));

  // Cron over HTTP (optional, for hosts where only URL cron is practical). Requires CRON_KEY.
  api.post('/cron', async (req, res, next) => {
    try {
      const key = req.get('x-cron-key') ?? '';
      if (!cfg.cronKey || key.length !== cfg.cronKey.length || !require('crypto').timingSafeEqual(Buffer.from(key), Buffer.from(cfg.cronKey))) throw new ApiError('Not found', 'not_found', 404);
      const mail = await Mailer.processQueue(50);
      const retention = req.query.retention === '1' ? await runRetention(null) : null;
      res.json({ mail, retention });
    } catch (e) { next(e); }
  });
  api.use('/admin', adminRouter);
  api.use('/', publicRouter);
  api.use((_req, _res, next) => next(new ApiError('Not found', 'not_found', 404)));
  api.use(errorHandler(cfg.siteUrl));

  /* ------------------------------ Media ------------------------------ */
  app.get('/media/:file', mediaFileHandler);

  app.use('/api', api);
  if (!opts.site) app.use('/', api); // API-only mode (tests, or a host that strips the /api prefix)

  /* ------------------------------ Website ----------------------------- */
  if (opts.site) {
    const canonicalHost = new URL(cfg.siteUrl).host;
    app.use((req, res, next) => {
      // Canonical host: www.blazekonzult.nl -> blazekonzult.nl (HTTPS is enforced by the host's "Force HTTPS" setting)
      if (cfg.env === 'production' && req.hostname === `www.${canonicalHost}`) return res.redirect(301, `${cfg.siteUrl}${req.originalUrl}`);
      next();
    });
    app.use(redirectMiddleware);
    app.all('*', (req, res) => { opts.site!(req, res); });
  }
  return app;
}

/** Secure error responses: no stack traces or internals leave the server. */
function errorHandler(siteUrl: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err: any, req: Request, res: Response, _next: NextFunction) => {
    let e: ApiError;
    if (err instanceof ApiError) e = err;
    else if (err?.type === 'entity.parse.failed') e = new ApiError('Invalid JSON body.', 'bad_request', 400);
    else if (err?.type === 'entity.too.large') e = new ApiError('Request too large.', 'too_large', 413);
    else { console.error('[error]', req.method, req.originalUrl.split('?')[0], err?.stack ?? err); e = new ApiError('Something went wrong. Please try again later.', 'server_error', 500); }
    if (res.headersSent) return;
    res.status(e.status).set('Cache-Control', 'no-store');
    if (e.status === 429 && e.details?.retry_after) res.set('Retry-After', String(e.details.retry_after));
    if (/\/report$/.test(req.path) && req.method === 'GET') {
      res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
      res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Report unavailable</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;color:#0B1726"><h1 style="font-size:24px">Report link unavailable</h1><p>${e.message.replace(/[<>&]/g, '')}</p>
<p>Download links expire for your security. <a href="${siteUrl}/contact/">Contact BlazeKonzult</a> for a new link, or <a href="${siteUrl}/cybersecurity-assessment/">take the assessment again</a>.</p></body></html>`);
      return;
    }
    res.json({ error: { code: e.code, message: e.message, ...(Object.keys(e.details ?? {}).length ? { details: e.details } : {}) } });
  };
}
