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
    const profile = profiles[0] || null;

    if (!profile) return Response.json({ profile: null });

    // Try to authenticate the caller
    let caller = null;
    try { caller = await base44.auth.me(); } catch { caller = null; }

    // Authenticated callers get their own full profile (minus pin_hash).
    // Admins can view any profile.
    if (caller && (caller.id === profile.firebase_uid || caller.role === 'admin')) {
      const { pin_hash, ...safeProfile } = profile;
      return Response.json({ profile: safeProfile });
    }

    // Unauthenticated caller (login flow) — return minimal info only.
    // Enough for the login flow to proceed without exposing sensitive data.
    return Response.json({
      profile: {
        phone: profile.phone,
        firebase_uid: profile.firebase_uid,
        role: profile.role || "customer",
        profile_completed: profile.profile_completed || false,
        has_pin: !!profile.pin_hash,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});