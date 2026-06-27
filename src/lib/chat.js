import { base44 } from "@/api/base44Client";

// Find or create a conversation between a customer and a provider.
export async function getOrCreateConversation({
  providerId,
  providerName,
  providerPhoto,
  customerId,
  customerName,
}) {
  const existing = await base44.entities.Conversation.filter({
    provider_id: providerId,
    customer_id: customerId,
  });
  if (existing.length > 0) return existing[0];

  return base44.entities.Conversation.create({
    provider_id: providerId,
    provider_name: providerName,
    provider_photo: providerPhoto,
    customer_id: customerId,
    customer_name: customerName,
  });
}

// Convenience for opening a chat from a provider profile (customer side).
export async function openConversation(provider, customer) {
  return getOrCreateConversation({
    providerId: provider.id,
    providerName: provider.name,
    providerPhoto: provider.photo_url,
    customerId: customer.id,
    customerName: customer.full_name,
  });
}