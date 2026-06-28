import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { firebase_uid } = await req.json();
    if (!firebase_uid) {
      return Response.json({ error: "firebase_uid required" }, { status: 400 });
    }

    // Verify the caller is an admin via their UserProfile
    const callerProfiles = await base44.asServiceRole.entities.UserProfile.filter(
      { firebase_uid }, null, 1
    );
    if (callerProfiles.length === 0) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }
    if (callerProfiles[0].role !== "admin") {
      return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    // Fetch all admin data in parallel using service role
    const [providers, jobs, reviews, userProfiles, subscriptions] = await Promise.all([
      base44.asServiceRole.entities.ServiceProvider.list("-created_date", 100),
      base44.asServiceRole.entities.ServiceRequest.list("-created_date", 100),
      base44.asServiceRole.entities.Review.list("-created_date", 100),
      base44.asServiceRole.entities.UserProfile.list("-created_date", 100),
      base44.asServiceRole.entities.Subscription.filter({ status: "active" }, "-created_date", 100),
    ]);

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
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});