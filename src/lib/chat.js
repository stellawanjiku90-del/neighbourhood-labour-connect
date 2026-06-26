import { base44 } from "@/api/base44Client";

// Finds an existing conversation between the current user and a provider, or creates one.
export async function openConversation(provider) {
  const me = await base44.auth.me();
  const existing = await base44.entities.Conversation.filter({
    customer_id: me.id,
    provider_id: provider.id,
  });
  if (existing.length > 0) return existing[0];

  return base44.entities.Conversation.create({
    provider_id: provider.id,
    provider_name: provider.name,
    provider_photo: provider.photo_url,
    customer_id: me.id,
    customer_name: me.full_name,
  });
}