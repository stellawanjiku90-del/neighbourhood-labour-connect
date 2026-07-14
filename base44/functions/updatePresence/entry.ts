import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const status = body.provider_status || null;
    const now = new Date().toISOString();
    const role = user.role || 'customer';

    const existing = await base44.asServiceRole.entities.UserPresence.filter({ user_id: user.id }, null, 1);

    if (existing.length > 0) {
      const isManuallyOffline = existing[0].provider_status === 'offline';
      const update = {
        last_active: now,
        is_online: isManuallyOffline ? false : true,
        user_name: user.full_name || existing[0].user_name,
        role: role
      };
      if (status) update.provider_status = status;
      await base44.asServiceRole.entities.UserPresence.update(existing[0].id, update);
    } else {
      await base44.asServiceRole.entities.UserPresence.create({
        user_id: user.id,
        user_name: user.full_name || '',
        role: role,
        last_active: now,
        is_online: true,
        provider_status: role === 'provider' ? (status || 'available') : 'online'
      });
    }

    return Response.json({ status: 'online', last_active: now });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});