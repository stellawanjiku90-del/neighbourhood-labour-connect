import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized — OTP verification required" }, { status: 401 });

    const { phone, pin_hash } = await req.json();

    if (!phone || !pin_hash) {
      return Response.json({ error: "Phone and pin_hash are required" }, { status: 400 });
    }

    // Look up the caller's profile by their authenticated firebase_uid
    const callerProfiles = await base44.asServiceRole.entities.UserProfile.filter(
      { firebase_uid: user.id }, null, 1
    );
    if (callerProfiles.length === 0) {
      return Response.json({ error: "No account found for this phone number" }, { status: 404 });
    }

    // Verify the caller owns the phone number being reset
    if (callerProfiles[0].phone !== phone) {
      return Response.json({ error: "Phone number does not match your account" }, { status: 403 });
    }

    // Only update the PIN — all other profile fields are preserved
    const profile = await base44.asServiceRole.entities.UserProfile.update(
      callerProfiles[0].id,
      { pin_hash }
    );

    // Strip pin_hash from the response
    const { pin_hash: _removed, ...safeProfile } = profile;
    return Response.json({ profile: safeProfile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});