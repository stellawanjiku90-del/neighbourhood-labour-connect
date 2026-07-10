import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SCHEDULER_SECRET = "nlc-sched-7k3m9p2x8f";

async function isAuthorized(base44, req) {
  try {
    const user = await base44.auth.me();
    if (user && user.role === "admin") return true;
  } catch { /* not authenticated */ }
  try {
    const body = await req.clone().json();
    if (body && body.scheduler_secret === SCHEDULER_SECRET) return true;
  } catch { /* no body */ }
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!await isAuthorized(base44, req)) {
      return Response.json({ error: 'Forbidden — admin or scheduler only' }, { status: 403 });
    }

    // Mark all presences with heartbeat older than 90 seconds as offline
    const cutoff = new Date(Date.now() - 90 * 1000).toISOString();
    await base44.asServiceRole.entities.UserPresence.updateMany(
      { is_online: true, last_active: { $lt: cutoff } },
      { $set: { is_online: false } }
    );

    // Count current online for logging
    const online = await base44.asServiceRole.entities.UserPresence.filter({ is_online: true }, null, 1000);

    return Response.json({ cleaned: true, still_online: online.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});