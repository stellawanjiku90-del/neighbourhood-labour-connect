import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// KES rate: 1 USD = ~130 KES (matching the subscription payout)
const USD_TO_KES = 130;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { provider: pProvider } = await req.json();

    // Validate the payout provider against an allowlist
    const ALLOWED_PROVIDERS = ['M-PESA', 'AIRTEL', 'EQUITEL', 'intasend'];
    const provider = ALLOWED_PROVIDERS.includes(pProvider) ? pProvider : 'M-PESA';
    const firebase_uid = user.id;

    // ─── Fetch the user's profile ─────────────────────────────────
    const profiles = await base44.asServiceRole.entities.UserProfile.filter(
      { firebase_uid }, null, 1
    );
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }
    const profile = profiles[0];

    // Destination phone is ALWAYS the authenticated user's own registered
    // phone — never from client input — preventing payout diversion.
    const phone = profile.phone.replace('+', '');

    if (!phone) {
      return Response.json({ error: 'No phone number available for payout' }, { status: 400 });
    }

    // ─── Calculate available balance (referral + provider earnings) ─
    const [earnings, providers] = await Promise.all([
      base44.asServiceRole.entities.ReferralEarning.filter(
        { earner_id: firebase_uid, status: "pending" }, null, 500
      ),
      profile.phone
        ? base44.asServiceRole.entities.ServiceProvider.filter({ phone: profile.phone }, null, 1)
        : Promise.resolve([]),
    ]);
    const referralTotal = earnings.reduce((s, e) => s + (e.amount || 0), 0);
    const providerEarnings = providers[0]?.earnings || 0;
    const gross = +(referralTotal + providerEarnings).toFixed(2);

    // Subtract any pending withdrawals
    const pending = await base44.asServiceRole.entities.WithdrawalRequest.filter(
      { user_id: firebase_uid, status: { $in: ['pending', 'processing'] } }, null, 500
    );
    const pendingAmount = pending.reduce((s, w) => s + (w.amount || 0), 0);
    const available = +(gross - pendingAmount).toFixed(2);

    if (available <= 0) {
      return Response.json({ error: `No balance available to withdraw (available: $${available})` }, { status: 400 });
    }

    if (available < 1.0) {
      return Response.json({ error: `Minimum withdrawal is $1.00 (available: $${available})` }, { status: 400 });
    }

    const withdrawAmount = Math.min(available, 100); // cap at $100 per request for now
    const amountKes = Math.round(withdrawAmount * USD_TO_KES);

    // ─── Create withdrawal request record ──────────────────────────
    const fullName = `${profile.first_name || ''} ${profile.surname || ''}`.trim() || profile.phone;
    const request = await base44.asServiceRole.entities.WithdrawalRequest.create({
      user_id: firebase_uid,
      user_name: fullName,
      user_phone: profile.phone,
      provider,
      amount: withdrawAmount,
      amount_kes: amountKes,
      status: 'processing',
    });
    const requestId = request.id;

    // ─── IntaSend Send Money: Initiate ─────────────────────────────
    const apiKey = Deno.env.get('INTASEND_API_KEY');
    const publishableKey = Deno.env.get('INTASEND_PUBLISHABLE_KEY');
    if (!apiKey || !publishableKey) {
      await base44.asServiceRole.entities.WithdrawalRequest.update(requestId, {
        status: 'failed',
        error_message: 'Payment gateway not configured',
      });
      return Response.json({ error: 'IntaSend keys not configured' }, { status: 500 });
    }

    const isTest = publishableKey.includes('test');
    const baseUrl = isTest ? 'https://sandbox.intasend.com' : 'https://payment.intasend.com';

    const name = `${profile.first_name || ''} ${profile.surname || ''}`.trim() || 'Customer';
    const narrative = `NLC withdrawal #${requestId.substring(0, 8)}`;

    // M-Pesa B2C / Mobile Money method
    const payload = {
      public_key: publishableKey,
      method: 'M-PESA',
      amount: amountKes,
      currency: 'KES',
      name,
      phone_number: phone,
      narrative,
      api_ref: `NLC|${firebase_uid}`,
    };

    const initRes = await fetch(`${baseUrl}/api/v1/send-money/initiate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Base44)',
      },
      body: JSON.stringify(payload),
    });

    const initText = await initRes.text();
    let initData;
    try { initData = JSON.parse(initText); } catch { initData = null; }

    if (!initRes.ok) {
      await base44.asServiceRole.entities.WithdrawalRequest.update(requestId, {
        status: 'failed',
        error_message: `IntaSend initiate failed: ${initData?.error || initData?.detail || initText}`,
      });
      return Response.json({ error: 'Payout initiation failed', details: initData || initText }, { status: 502 });
    }

    const requestIds = initData.request_ids?.[0] || initData.id;

    // ─── Approve the payout request ────────────────────────────────
    const approvePayload = { request_ids: [requestIds] };
    const digest = await crypto.subtle.digest(
      'SHA-256', new TextEncoder().encode(JSON.stringify(approvePayload))
    );
    const digestB64 = btoa(String.fromCharCode(...new Uint8Array(digest)));

    const approveRes = await fetch(`${baseUrl}/api/v1/send-money/approve/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Digest': 'SHA-256=' + digestB64,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Base44)',
      },
      body: JSON.stringify(approvePayload),
    });

    const approveText = await approveRes.text();
    let approveData;
    try { approveData = JSON.parse(approveText); } catch { approveData = null; }

    let status = 'completed';
    let trackingId = null;

    if (approveRes.ok) {
      trackingId = approveData.tracking_id || approveData.id || approveData.tracking?.[0]?.tracking_id;
    } else {
      status = 'failed';
    }

    await base44.asServiceRole.entities.WithdrawalRequest.update(requestId, {
      status,
      tracking_id: trackingId || requestIds,
      error_message: approveRes.ok ? null : (approveData?.error || approveData?.detail || approveText),
    });

    return Response.json({
      success: approveRes.ok,
      request_id: requestId,
      amount: withdrawAmount,
      amount_kes: amountKes,
      phone,
      tracking_id: trackingId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});