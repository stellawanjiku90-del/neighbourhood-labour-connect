import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authentication — prevents querying another user's subscription
    // status by supplying their firebase_uid.
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Authentication required" }, { status: 401 });
    const firebase_uid = caller.id;

    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { user_id: firebase_uid, status: "active" }, "-created_date", 1
    );
    if (subs.length === 0) return Response.json({ active: false });

    const sub = subs[0];
    const now = new Date();
    const periodEnd = new Date(sub.period_end);

    if (periodEnd > now) {
      return Response.json({ active: true, period_end: sub.period_end, amount: sub.amount });
    }

    // Period lapsed — mark expired
    await base44.asServiceRole.entities.Subscription.update(sub.id, { status: "expired" });
    return Response.json({ active: false, period_end: sub.period_end });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});