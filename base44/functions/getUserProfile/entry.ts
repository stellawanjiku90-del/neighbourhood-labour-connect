import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, firebase_uid } = await req.json();

    if (!phone && !firebase_uid) {
      return Response.json({ error: "Phone or firebase_uid is required" }, { status: 400 });
    }

    const query = phone ? { phone } : { firebase_uid };
    const profiles = await base44.asServiceRole.entities.UserProfile.filter(query);
    return Response.json({ profile: profiles[0] || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});