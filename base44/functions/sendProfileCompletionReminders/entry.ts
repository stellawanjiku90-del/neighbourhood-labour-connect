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

// ─── Firebase OAuth2 helpers (RS256 JWT → access token) ──────────
function base64url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToBuffer(pem) {
  const b64 = pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const data = new TextEncoder().encode(headerB64 + "." + payloadB64);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, data);
  const jwt = headerB64 + "." + payloadB64 + "." + base64url(signature);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const token = await res.json();
  return token.access_token;
}

async function sendFcm(accessToken, projectId, token, title, body, dataPayload) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: dataPayload || {},
          webpush: {
            notification: { icon: "/icon.png", badge: "/icon.png", tag: "reminder" },
          },
        },
      }),
    }
  );
  return { ok: res.ok };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!await isAuthorized(base44, req)) {
      return Response.json({ error: 'Forbidden — admin or scheduler only' }, { status: 403 });
    }

    // Get all users who haven't completed profile
    const allProfiles = await base44.asServiceRole.entities.UserProfile.filter({
      profile_completed: false
    });

    // Get all users without active subscription
    const allSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      status: 'active'
    });
    const subscribedUserIds = new Set(allSubscriptions.map(s => s.user_id));

    // Find users who need reminders
    const incompleteProfiles = allProfiles.filter(p => !p.profile_completed);
    const unsubscribedUsers = allProfiles.filter(p =>
      p.profile_completed && !subscribedUserIds.has(p.firebase_uid)
    );

    // Get device tokens for notifications
    const allTokens = await base44.asServiceRole.entities.DeviceToken.list();

    // ─── Derive OAuth2 access token from the service account JSON ──
    // Never place the raw service account JSON in an Authorization header.
    const rawSA = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!rawSA) {
      return Response.json({ error: 'Firebase service account not configured' }, { status: 500 });
    }
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(rawSA);
    } catch (e) {
      return Response.json({ error: 'Invalid Firebase service account JSON: ' + e.message }, { status: 500 });
    }
    const projectId = serviceAccount.project_id;
    const accessToken = await getAccessToken(serviceAccount);

    let notificationsSent = 0;

    // Send notifications to users with incomplete profiles
    for (const profile of incompleteProfiles) {
      const tokens = allTokens.filter(t => t.user_id === profile.firebase_uid);
      for (const token of tokens) {
        try {
          const result = await sendFcm(
            accessToken, projectId, token.token,
            'Complete Your Profile',
            'Finish setting up your profile to start posting or finding jobs on Neighbourhood Labour Connect!',
            { type: 'profile_completion', action: 'complete_profile' }
          );
          if (result.ok) notificationsSent++;
        } catch (e) {
          console.error('Failed to send notification:', e);
        }
      }
    }

    // Send notifications to users without subscription
    for (const profile of unsubscribedUsers) {
      const tokens = allTokens.filter(t => t.user_id === profile.firebase_uid);
      for (const token of tokens) {
        try {
          const result = await sendFcm(
            accessToken, projectId, token.token,
            'Subscribe to Get Started',
            'Your profile is ready! Subscribe for just $1/month to start posting or finding jobs.',
            { type: 'subscription_reminder', action: 'subscribe' }
          );
          if (result.ok) notificationsSent++;
        } catch (e) {
          console.error('Failed to send notification:', e);
        }
      }
    }

    return Response.json({
      success: true,
      notificationsSent,
      incompleteProfiles: incompleteProfiles.length,
      unsubscribedUsers: unsubscribedUsers.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});