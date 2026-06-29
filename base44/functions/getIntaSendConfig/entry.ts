import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Returns the IntaSend publishable (public) key and environment flag.
 * The publishable key is safe to expose on the frontend — it only identifies
 * the business during checkout. The secret key is never sent to the client.
 */
Deno.serve(async (req) => {
  try {
    const publishableKey = Deno.env.get("INTASEND_PUBLISHABLE_KEY");
    if (!publishableKey) {
      return Response.json(
        { error: "IntaSend publishable key not configured" },
        { status: 500 }
      );
    }
    // Test keys contain "test"; everything else is treated as live.
    const live = !publishableKey.includes("test");
    return Response.json({ publishable_key: publishableKey, live });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});