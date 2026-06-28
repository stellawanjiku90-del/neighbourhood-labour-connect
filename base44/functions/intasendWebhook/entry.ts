import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUBSCRIPTION_AMOUNT = 1.00; // USD stored in DB
const LEVEL_RATES = [0.10, 0.05, 0.02]; // Level 1=10%, 2=5%, 3=2%

Deno.serve(async (req) => {
  try {
    // ─── Verify the webhook challenge ─────────────────────────────
    const webhookSecret = Deno.env.get("INTASEND_WEBHOOK_SECRET");
    const rawBody = await req.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // IntaSend sends the challenge you set in their dashboard. Check common
    // locations: body fields and headers. Also scan all headers as a fallback.
    const challenge =
      body.challenge ||
      body.verification ||
      req.headers.get("x-intasend-challenge") ||
      req.headers.get("x-verification") ||
      "";

    let verified = challenge === webhookSecret;
    if (!verified && webhookSecret) {
      for (const [, value] of req.headers.entries()) {
        if (value === webhookSecret) {
          verified = true;
          break;
        }
      }
    }

    if (webhookSecret && !verified) {
      return Response.json({ error: "Invalid challenge" }, { status: 403 });
    }

    // ─── Extract the invoice from the payload ─────────────────────
    // IntaSend may wrap the invoice in an event envelope or send it directly.
    const invoice = body.invoice || body.data?.invoice || body;
    const state = invoice.state;
    const apiRef = invoice.api_ref || "";

    // Only process successful payments
    if (state !== "SUCCESS" && state !== "COMPLETED") {
      return Response.json({ received: true, state: state || "UNKNOWN" });
    }

    // Extract the user ID from the api_ref (format: "NLC|{firebase_uid}")
    const parts = apiRef.split("|");
    const userId = parts[1];
    if (!userId) {
      return Response.json({ error: "No user ID in api_ref" }, { status: 400 });
    }

    // ─── Activate the subscription (service role — no user auth) ──
    const base44 = createClientFromRequest(req);

    // Idempotency: skip if already active
    const existing = await base44.asServiceRole.entities.Subscription.filter(
      { user_id: userId, status: "active" }, "-created_date", 1
    );
    if (existing.length > 0) {
      return Response.json({
        received: true,
        state: "SUCCESS",
        already_active: true,
      });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter(
      { firebase_uid: userId }, null, 1
    );
    if (profiles.length === 0) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }
    const subscriber = profiles[0];
    const subscriberName = `${subscriber.first_name || ""} ${subscriber.surname || ""}`.trim() || subscriber.phone;

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Expire any previously active subscriptions
    await base44.asServiceRole.entities.Subscription.updateMany(
      { user_id: userId, status: "active" },
      { $set: { status: "expired" } }
    );

    // Create the new active subscription
    await base44.asServiceRole.entities.Subscription.create({
      user_id: userId,
      user_phone: subscriber.phone,
      user_name: subscriberName,
      status: "active",
      amount: SUBSCRIPTION_AMOUNT,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      activated_by: "intasend-webhook",
    });

    // ─── Cascade referral earnings up to 3 levels ─────────────────
    let currentProfile = subscriber;
    for (let level = 1; level <= 3; level++) {
      const referrerUid = currentProfile?.referred_by;
      if (!referrerUid) break;

      const referrerProfiles = await base44.asServiceRole.entities.UserProfile.filter(
        { firebase_uid: referrerUid }, null, 1
      );
      if (referrerProfiles.length === 0) break;
      const referrer = referrerProfiles[0];
      const referrerName = `${referrer.first_name || ""} ${referrer.surname || ""}`.trim() || referrer.phone;
      const amount = +(SUBSCRIPTION_AMOUNT * LEVEL_RATES[level - 1]).toFixed(2);

      const existingEarning = await base44.asServiceRole.entities.ReferralEarning.filter(
        { earner_id: referrerUid, source_subscriber_id: userId, level }, null, 1
      );
      if (existingEarning.length === 0) {
        await base44.asServiceRole.entities.ReferralEarning.create({
          earner_id: referrerUid,
          earner_name: referrerName,
          source_subscriber_id: userId,
          source_name: subscriberName,
          level,
          amount,
          status: "pending",
        });
      }

      currentProfile = referrer;
    }

    // Mark the direct referral record as subscribed
    await base44.asServiceRole.entities.Referral.updateMany(
      { referred_id: userId, status: "registered" },
      { $set: { status: "subscribed" } }
    );

    return Response.json({
      received: true,
      state: "SUCCESS",
      activated: true,
      user_id: userId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});