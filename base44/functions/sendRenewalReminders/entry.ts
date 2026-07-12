import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

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
            notification: {
              icon: "/icon.png",
              badge: "/icon.png",
              tag: "renewal-reminder",
              requireInteraction: true,
            },
            fcm_options: { link: "/subscribe" },
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

    // Active subscriptions expiring within the next 24 hours
    const activeSubs = await base44.asServiceRole.entities.Subscription.filter(
      { status: "active" }, null, 500
    );
    const now = Date.now();
    const horizon = now + 24 * 60 * 60 * 1000;
    const expiring = activeSubs.filter((s) => {
      if (!s.period_end) return false;
      const end = new Date(s.period_end).getTime();
      return end > now && end <= horizon;
    });

    if (expiring.length === 0) {
      return Response.json({ sent: 0, reason: "no subscriptions expiring soon" });
    }

    let rawSA = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (rawSA && !rawSA.trim().endsWith("}")) {
      rawSA = rawSA.trim() + "}";
    }
    const serviceAccount = JSON.parse(rawSA);
    const projectId = serviceAccount.project_id;
    const accessToken = await getAccessToken(serviceAccount);

    const title = "Subscription due";
    const bodyText = "Tap to confirm your Ksh 130 monthly payment and keep your access.";

    let sent = 0;
    let attempted = 0;
    for (const sub of expiring) {
      if (!sub.user_id) continue;
      const deviceTokens = await base44.asServiceRole.entities.DeviceToken.filter({
        user_id: sub.user_id,
      });
      for (const dt of deviceTokens) {
        if (dt.token) {
          attempted++;
          const ok = await sendFcm(accessToken, projectId, dt.token, title, bodyText);
          if (ok) sent++;
        }
      }
    }

    return Response.json({ sent, attempted, expiring: expiring.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});