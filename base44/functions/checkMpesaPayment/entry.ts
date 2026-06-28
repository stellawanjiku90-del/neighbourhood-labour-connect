import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INTASEND_STATUS_URL = "https://api.intasend.com/api/v1/payment/status/";
const SUBSCRIPTION_AMOUNT = 1.00; // USD stored in DB
const LEVEL_RATES = [0.10, 0.05, 0.02]; // Level 1=10%, 2=5%, 3=2%

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { invoice_id, firebase_uid } = await req.json();
    if (!invoice_id) {
      return Response.json({ error: "invoice_id required" }, { status: 400 });
    }
    if (!firebase_uid) {
      return Response.json({ error: "firebase_uid required" }, { status: 400 });
    }

    const apiKey = Deno.env.get("INTASEND_API_KEY");
    const publishableKey = Deno.env.get("INTASEND_PUBLISHABLE_KEY");
    if (!apiKey || !publishableKey) {
      return Response.json({ error: "IntaSend keys not configured" }, { status: 500 });
    }

    // Query IntaSend for the current payment status
    const response = await fetch(INTASEND_STATUS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        public_key: publishableKey,
        invoice_id,
      }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json({
        state: "PENDING",
        note: "Payment is still being processed.",
      });
    }
    const state = data.invoice?.state;

    // ─── Payment successful — activate subscription ──────────────
    if (state === "SUCCESS" || state === "COMPLETED") {
      // Idempotency: skip if already active
      const existing = await base44.asServiceRole.entities.Subscription.filter(
        { user_id: firebase_uid, status: "active" }, "-created_date", 1
      );
      if (existing.length > 0) {
        return Response.json({
          state: "SUCCESS",
          already_active: true,
          period_end: existing[0].period_end,
        });
      }

      const profiles = await base44.asServiceRole.entities.UserProfile.filter(
        { firebase_uid }, null, 1
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
        { user_id: firebase_uid, status: "active" },
        { $set: { status: "expired" } }
      );

      // Create the new active subscription
      await base44.asServiceRole.entities.Subscription.create({
        user_id: firebase_uid,
        user_phone: subscriber.phone,
        user_name: subscriberName,
        status: "active",
        amount: SUBSCRIPTION_AMOUNT,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        activated_by: "intasend-payment",
      });

      // ─── Cascade referral earnings up to 3 levels ───────────────
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
          { earner_id: referrerUid, source_subscriber_id: firebase_uid, level }, null, 1
        );
        if (existingEarning.length === 0) {
          await base44.asServiceRole.entities.ReferralEarning.create({
            earner_id: referrerUid,
            earner_name: referrerName,
            source_subscriber_id: firebase_uid,
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
        { referred_id: firebase_uid, status: "registered" },
        { $set: { status: "subscribed" } }
      );

      return Response.json({
        state: "SUCCESS",
        activated: true,
        period_end: periodEnd.toISOString(),
      });
    }

    // ─── Payment failed ──────────────────────────────────────────
    if (state === "FAILED" || state === "CANCELLED") {
      return Response.json({
        state,
        reason: data.invoice?.failed_reason || "Payment was not completed.",
      });
    }

    // Still pending
    return Response.json({ state: state || "PENDING" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});