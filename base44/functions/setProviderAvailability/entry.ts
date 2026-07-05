import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { status } = body;
    const valid = ['online', 'available', 'busy', 'offline'];
    if (!valid.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });

    // Update ServiceProvider availability
    const providers = await base44.asServiceRole.entities.ServiceProvider.filter({ firebase_uid: user.id }, null, 1);
    if (providers.length > 0) {
      await base44.asServiceRole.entities.ServiceProvider.update(providers[0].id, { availability_status: status });
    }

    // Update UserPresence provider_status
    const now = new Date().toISOString();
    const presences = await base44.asServiceRole.entities.UserPresence.filter({ user_id: user.id }, null, 1);
    if (presences.length > 0) {
      await base44.asServiceRole.entities.UserPresence.update(presences[0].id, {
        provider_status: status,
        last_active: now,
        is_online: status !== 'offline'
      });
    } else {
      await base44.asServiceRole.entities.UserPresence.create({
        user_id: user.id,
        user_name: user.full_name || '',
        role: 'provider',
        last_active: now,
        is_online: status !== 'offline',
        provider_status: status
      });
    }

    return Response.json({ status: 'updated', provider_status: status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});