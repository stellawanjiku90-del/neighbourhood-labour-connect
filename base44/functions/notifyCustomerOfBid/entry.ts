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
            notification: { icon: "/icon.png", badge: "/icon.png", tag: "new-bid" },
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
    const { request_id, provider_name, charge, request_title } = body;

    if (!request_id) {
      return Response.json({ sent: 0, reason: "no request_id" });
    }

    // Fetch the job to find the customer
    let job;
    try {
      job = await base44.asServiceRole.entities.ServiceRequest.get(request_id);
    } catch (_) {
      return Response.json({ sent: 0, reason: "job not found" });
    }
    if (!job || !job.customer_id) {
      return Response.json({ sent: 0, reason: "no customer for this job" });
    }

    // Only notify subscribed customers
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter(
      { user_id: job.customer_id, status: "active" },
      null,
      1
    );
    const now = Date.now();
    const isSubscribed = subscriptions.some(
      (s) => !s.period_end || new Date(s.period_end).getTime() > now
    );
    if (!isSubscribed) {
      return Response.json({ sent: 0, reason: "customer not subscribed" });
    }

    // Gather the customer's device tokens
    const deviceTokens = await base44.asServiceRole.entities.DeviceToken.filter({
      user_id: job.customer_id,
    });
    const tokens = deviceTokens
      .map((d) => d.token)
      .filter((t) => t && t.length > 0);
    if (tokens.length === 0) {
      return Response.json({ sent: 0, reason: "no registered devices" });
    }

    const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT"));
    const projectId = serviceAccount.project_id;
    const accessToken = await getAccessToken(serviceAccount);

    const title = "New offer on your job";
    const bodyText = `${provider_name || "A provider"} offered KES ${charge || 0} for "${request_title || job.title || "your job"}"`;

    const results = await Promise.all(
      tokens.map((t) => sendFcm(accessToken, projectId, t, title, bodyText))
    );
    const sent = results.filter(Boolean).length;

    return Response.json({ sent, total: tokens.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});