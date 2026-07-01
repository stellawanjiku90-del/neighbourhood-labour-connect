import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

async function sendFcm(accessToken, projectId, token, title, body) {
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
          webpush: {
            notification: { icon: "/icon.png", badge: "/icon.png", tag: "new-job" },
          },
        },
      }),
    }
  );
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const job = body.data || body;

    if (!job || job.lat == null || job.lng == null) {
      return Response.json({ sent: 0, reason: "no coordinates" });
    }

    const providers = await base44.asServiceRole.entities.ServiceProvider.list(null, 50);
    const nearby = providers.filter((p) => {
      if (p.lat == null || p.lng == null) return false;
      const dist = haversine(job.lat, job.lng, p.lat, p.lng);
      if (dist > (p.service_radius_km || 10)) return false;
      if (job.category && Array.isArray(p.professions) && p.professions.length > 0) {
        return p.professions.includes(job.category);
      }
      return true;
    });

    if (nearby.length === 0) {
      return Response.json({ sent: 0, reason: "no nearby providers" });
    }

    // Check subscriptions to customize the message — but send to ALL nearby
    // providers (including non-subscribed) to motivate them to subscribe.
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      { status: "active" },
      null,
      500
    );
    const now = Date.now();
    const subscribedIds = new Set(
      subscriptions
        .filter((s) => !s.period_end || new Date(s.period_end).getTime() > now)
        .map((s) => s.user_id)
    );

    // Fetch device tokens for ALL nearby providers in parallel
    const tokenResults = await Promise.all(
      nearby
        .filter((p) => p.firebase_uid)
        .map((p) =>
          base44.asServiceRole.entities.DeviceToken.filter({
            user_id: p.firebase_uid,
          }).then((tokens) => ({ provider: p, tokens }))
        )
    );

    const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT"));
    const projectId = serviceAccount.project_id;
    const accessToken = await getAccessToken(serviceAccount);

    const title = job.emergency ? "🚨 Emergency job nearby" : "New job nearby";
    const jobTitle = job.title || "A customer posted a job near you";

    const sendPromises = [];
    for (const { provider, tokens } of tokenResults) {
      if (!tokens.length) continue;
      const isSubscribed = provider.firebase_uid && subscribedIds.has(provider.firebase_uid);
      const bodyText = isSubscribed
        ? jobTitle
        : `${jobTitle} — Subscribe to view details and apply`;
      for (const dt of tokens) {
        if (dt.token) {
          sendPromises.push(sendFcm(accessToken, projectId, dt.token, title, bodyText));
        }
      }
    }

    if (sendPromises.length === 0) {
      return Response.json({ sent: 0, reason: "no registered devices" });
    }

    const results = await Promise.all(sendPromises);
    const sent = results.filter(Boolean).length;

    return Response.json({ sent, total: sendPromises.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});