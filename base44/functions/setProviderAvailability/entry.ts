import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Try auth.me() first, fall back to firebase_uid from body
    let userId = null;
    let body = {};
    try {
      const user = await base44.auth.me();
      if (user) userId = user.id;
    } catch {}
    
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    
    const { status, firebase_uid } = body;
    if (!userId && firebase_uid) userId = firebase_uid;
    
    if (!userId) return Response.json({ error: 'Unauthorized — no user identity' }, { status: 401 });
    
    const valid = ['online', 'available', 'busy', 'offline'];
    if (!valid.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });

    // Update ServiceProvider availability
    const providers = await base44.asServiceRole.entities.ServiceProvider.filter({ firebase_uid: userId }, null, 1);
    if (providers.length === 0) {
      return Response.json({ error: 'Provider not found for this user' }, { status: 404 });
    }
    await base44.asServiceRole.entities.ServiceProvider.update(providers[0].id, { availability_status: status });

    // Update UserPresence provider_status
    const now = new Date().toISOString();
    const presences = await base44.asServiceRole.entities.UserPresence.filter({ user_id: userId }, null, 1);
    if (presences.length > 0) {
      await base44.asServiceRole.entities.UserPresence.update(presences[0].id, {
        provider_status: status,
        last_active: now,
        is_online: status !== 'offline'
      });
    } else {
      await base44.asServiceRole.entities.UserPresence.create({
        user_id: userId,
        user_name: providers[0].name || '',
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