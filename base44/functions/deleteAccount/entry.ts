import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await base44.asServiceRole.entities.ServiceProvider.deleteMany({ created_by_id: user.id });
    await base44.asServiceRole.entities.ServiceRequest.deleteMany({ created_by_id: user.id });
    await base44.asServiceRole.entities.Conversation.deleteMany({ customer_id: user.id });
    await base44.asServiceRole.entities.Message.deleteMany({ sender_id: user.id });
    await base44.asServiceRole.entities.Review.deleteMany({ created_by_id: user.id });
    await base44.asServiceRole.entities.DeviceToken.deleteMany({ user_id: user.id });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});