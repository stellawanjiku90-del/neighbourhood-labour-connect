import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, pin_hash } = await req.json();

    if (!phone || !pin_hash) {
      return Response.json({ error: "phone and pin_hash are required" }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ phone }, null, 1);
    if (profiles.length === 0) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profiles[0];

    // Verify the PIN server-side — never expose pin_hash to the client
    if (pin_hash !== profile.pin_hash) {
      return Response.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    // Return the full profile with pin_hash stripped
    const { pin_hash: _removed, ...safeProfile } = profile;
    return Response.json({ profile: safeProfile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});