import { Router } from 'express';
import { h, ApiError, locale } from '../http';
import { Templates } from '../templates';
import { Assessments, Sessions } from '../assessments';
import { Leads } from '../leads';
import { downloadReport } from '../report';

export const publicRouter = Router();

const noStore = (res: any) => { res.set('Cache-Control', 'no-store'); res.set('X-Robots-Tag', 'noindex, nofollow'); };

publicRouter.get('/health', h(async () => ({ ok: true })));

publicRouter.get('/templates', h(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  return { templates: await Templates.publicList(locale(req.query.locale)) };
}));

publicRouter.get('/templates/:slug', h(async (req, res) => {
  const t = await Templates.bySlug(String(req.params.slug));
  if (!t || t.status !== 'published' || !t.current_version_id) throw new ApiError('Assessment not found', 'not_found', 404);
  const v = await Templates.versionRow(t.current_version_id);
  const snap = await Templates.snapshotByVersion(t.current_version_id);
  res.set('Cache-Control', 'public, max-age=120');
  return Templates.clientPayload(snap, v!.id, v!.version, locale(req.query.locale));
}));

publicRouter.post('/sessions', h(async (req) => Sessions.start(req, req.body)));
publicRouter.post('/sessions/progress', h(async (req) => Sessions.progress(req, req.body)));

publicRouter.post('/submit', h(async (req, res) => { noStore(res); return Assessments.submit(req, req.body); }));

publicRouter.get('/results/:token', h(async (req, res) => { noStore(res); return Assessments.resultByToken(String(req.params.token)); }));

publicRouter.post('/leads', h(async (req, res) => { noStore(res); return Leads.fromAssessment(req, req.body); }));
publicRouter.post('/forms', h(async (req, res) => { noStore(res); return Leads.fromForm(req, req.body); }));

publicRouter.get('/report', h(async (req, res) => {
  const { pdf, filename } = await downloadReport(req, req.query.t);
  noStore(res);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.set('Content-Length', String(pdf.length));
  res.end(pdf);
}));
