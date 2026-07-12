import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Entity automation payload: { event, data }
    // Direct invocation: { conversation_id, sender_id, ... }
    const msg = body.data || body;
    if (!msg?.conversation_id || !msg?.sender_id) {
      return Response.json({ skipped: true, reason: "no message data" });
    }

    // Get the conversation to find the recipient
    const conv = await base44.asServiceRole.entities.Conversation
      .get(msg.conversation_id)
      .catch(() => null);
    if (!conv) {
      return Response.json({ skipped: true, reason: "conversation not found" });
    }

    // Determine recipient (the party that didn't send the message)
    const isSenderCustomer = msg.sender_id === conv.customer_id;
    let recipientId;
    let senderName;

    if (isSenderCustomer) {
      // Sender is customer → recipient is provider
      // conv.provider_id is the ServiceProvider entity ID, need firebase_uid
      const provider = await base44.asServiceRole.entities.ServiceProvider
        .get(conv.provider_id)
        .catch(() => null);
      recipientId = provider?.firebase_uid;
      senderName = conv.customer_name || msg.sender_name || "Customer";
    } else {
      // Sender is provider → recipient is customer
      recipientId = conv.customer_id;
      senderName = conv.provider_name || msg.sender_name || "Provider";
    }

    if (!recipientId) {
      return Response.json({ skipped: true, reason: "no recipient" });
    }

    // Create in-app notification for the recipient
    await base44.asServiceRole.entities.InAppNotification.create({
      user_id: recipientId,
      title: `New message from ${senderName}`,
      body: (msg.text || "").substring(0, 100),
      type: "message",
      read: false,
      link: `/chat/${msg.conversation_id}`,
    });

    return Response.json({ created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});