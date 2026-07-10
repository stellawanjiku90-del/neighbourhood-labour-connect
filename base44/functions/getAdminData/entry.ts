import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

    // Fetch all admin data in parallel using service role
    const [providers, jobs, reviews, userProfiles, subscriptions, deviceTokens] = await Promise.all([
      base44.asServiceRole.entities.ServiceProvider.list("-created_date", 500),
      base44.asServiceRole.entities.ServiceRequest.list("-created_date", 500),
      base44.asServiceRole.entities.Review.list("-created_date", 500),
      base44.asServiceRole.entities.UserProfile.list("-created_date", 500),
      base44.asServiceRole.entities.Subscription.list("-created_date", 500),
      base44.asServiceRole.entities.DeviceToken.list("-created_date", 500),
    ]);

    // Live users = distinct user_ids with a registered device token (app
    // installed & push-enabled). A user may have multiple tokens/devices.
    const liveUserIds = new Set(
      deviceTokens.map((t) => t.user_id).filter(Boolean)
    );

    // App income = total subscription revenue collected across all periods
    const income = subscriptions.reduce(
      (sum, s) => sum + (s.amount || 0),
      0
    );

    return Response.json({
      providers,
      jobs,
      reviews,
      userProfiles,
      subscriptions,
      stats: {
        providers: providers.length,
        jobs: jobs.length,
        openJobs: jobs.filter((j) => j.status === "open").length,
        reviews: reviews.length,
        registeredUsers: userProfiles.length,
        liveUsers: liveUserIds.size,
        income: +income.toFixed(2),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});