import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

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