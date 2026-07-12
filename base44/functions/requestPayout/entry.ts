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

    const fullName = `${profile.first_name || ''} ${profile.surname || ''}`.trim() || profile.phone;

    // ─── Per-user mutex: reject if a withdrawal is already in progress ──
    // This prevents the TOCTOU race where concurrent requests read the same
    // available balance and both trigger payouts for the same earnings.
    const existingPending = await base44.asServiceRole.entities.WithdrawalRequest.filter(
      { user_id: firebase_uid, status: { $in: ['pending', 'processing'] } }, null, 1
    );
    if (existingPending.length > 0) {
      return Response.json(
        { error: 'A withdrawal is already in progress. Please wait for it to complete.' },
        { status: 409 }
      );
    }

    // ─── Create withdrawal request as a lock (amount filled in later) ──
    const request = await base44.asServiceRole.entities.WithdrawalRequest.create({
      user_id: firebase_uid,
      user_name: fullName,
      user_phone: profile.phone,
      provider,
      amount: 0,
      amount_kes: 0,
      status: 'processing',
    });
    const requestId = request.id;

    // ─── Double-check: ensure we're the only 'processing' withdrawal ──
    // Closes the TOCTOU window between the check above and the create.
    // If two concurrent requests both pass the check and both create, the
    // one with the earlier created_date wins; the other bails.
    const allProcessing = await base44.asServiceRole.entities.WithdrawalRequest.filter(
      { user_id: firebase_uid, status: 'processing' }, 'created_date', 10
    );
    if (allProcessing.length > 1 && allProcessing[0].id !== requestId) {
      await base44.asServiceRole.entities.WithdrawalRequest.delete(requestId);
      return Response.json(
        { error: 'A withdrawal is already in progress. Please wait for it to complete.' },
        { status: 409 }
      );
    }

    // ─── Lock all pending referral earnings atomically ────────────
    // Transition pending → processing BEFORE calculating the balance so
    // that a concurrent request (if one slipped through the mutex) finds
    // no pending earnings to withdraw.
    await base44.asServiceRole.entities.ReferralEarning.updateMany(
      { earner_id: firebase_uid, status: 'pending' },
      { $set: { status: 'processing' } }
    );

    // Re-query the locked earnings to get the actual amount
    const lockedEarnings = await base44.asServiceRole.entities.ReferralEarning.filter(
      { earner_id: firebase_uid, status: 'processing' }, null, 500
    );
    const referralTotal = lockedEarnings.reduce((s, e) => s + (e.amount || 0), 0);

    // ─── Read provider earnings ────────────────────────────────────
    const providers = profile.phone
      ? await base44.asServiceRole.entities.ServiceProvider.filter({ phone: profile.phone }, null, 1)
      : [];
    const providerEarnings = providers[0]?.earnings || 0;

    const available = +(referralTotal + providerEarnings).toFixed(2);

    if (available <= 0 || available < 1.0) {
      // Revert earnings lock and fail the request
      await base44.asServiceRole.entities.ReferralEarning.updateMany(
        { earner_id: firebase_uid, status: 'processing' },
        { $set: { status: 'pending' } }
      );
      await base44.asServiceRole.entities.WithdrawalRequest.update(requestId, {
        status: 'failed',
        error_message: available <= 0
          ? `No balance available to withdraw (available: $${available})`
          : `Minimum withdrawal is $1.00 (available: $${available})`,
      });
      return Response.json({
        error: available <= 0
          ? `No balance available to withdraw`
          : `Minimum withdrawal is $1.00 (available: $${available})`
      }, { status: 400 });
    }

    const withdrawAmount = Math.min(available, 100); // cap at $100 per request
    const amountKes = Math.round(withdrawAmount * USD_TO_KES);

    // ─── Deduct provider earnings immediately ─────────────────────
    let providerEarningsLocked = 0;
    if (providers[0] && providerEarnings > 0) {
      const fromProvider = Math.max(0, withdrawAmount - referralTotal);
      if (fromProvider > 0) {
        providerEarningsLocked = Math.min(fromProvider, providerEarnings);
        await base44.asServiceRole.entities.ServiceProvider.update(providers[0].id, {
          earnings: Math.max(0, +(providerEarnings - providerEarningsLocked).toFixed(2))
        });
      }
    }

    // ─── Update withdrawal request with the correct amount ────────
    await base44.asServiceRole.entities.WithdrawalRequest.update(requestId, {
      amount: withdrawAmount,
      amount_kes: amountKes,
    });

    // ─── IntaSend Send Money: Initiate ─────────────────────────────
    const apiKey = Deno.env.get('INTASEND_API_KEY');
    const publishableKey = Deno.env.get('INTASEND_PUBLISHABLE_KEY');
    if (!apiKey || !publishableKey) {
      await revertLock(base44, firebase_uid, providers, providerEarnings);
      await base44.asServiceRole.entities.WithdrawalRequest.update(requestId, {
        status: 'failed',
        error_message: 'Payment gateway not configured',
      });
      return Response.json({ error: 'IntaSend keys not configured' }, { status: 500 });
    }

    const isTest = publishableKey.includes('test');
    const baseUrl = isTest ? 'https://sandbox.intasend.com' : 'https://payment.intasend.com';

    const name = fullName || 'Customer';
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
      await revertLock(base44, firebase_uid, providers, providerEarnings);
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

    // ─── Finalize locked earnings based on payout result ─────────
    if (status === 'completed') {
      await base44.asServiceRole.entities.ReferralEarning.updateMany(
        { earner_id: firebase_uid, status: 'processing' },
        { $set: { status: 'paid' } }
      );
    } else {
      await revertLock(base44, firebase_uid, providers, providerEarnings);
    }

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

// ─── Helper: revert locked earnings back to their pre-withdrawal state ──
async function revertLock(base44, firebaseUid, providers, originalProviderEarnings) {
  await base44.asServiceRole.entities.ReferralEarning.updateMany(
    { earner_id: firebaseUid, status: 'processing' },
    { $set: { status: 'pending' } }
  );
  if (providers[0] && originalProviderEarnings > 0) {
    await base44.asServiceRole.entities.ServiceProvider.update(providers[0].id, {
      earnings: originalProviderEarnings
    });
  }
}