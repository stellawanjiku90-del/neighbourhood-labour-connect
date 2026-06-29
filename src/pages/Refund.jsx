import LegalPage, { LegalSection } from "@/components/LegalPage";

export default function Refund() {
  return (
    <LegalPage title="Refund Policy" updated="June 26, 2026">
      <LegalSection heading="1. Overview">
        Neighbourhood Labour Connect facilitates connections between customers and service providers. Payments for services are arranged directly between the parties unless processed through the platform.
      </LegalSection>
      <LegalSection heading="2. Service Disputes">
        If a service is not performed as agreed, customers should first attempt to resolve the issue directly with the provider. If unresolved, you may report the issue through the app for review.
      </LegalSection>
      <LegalSection heading="3. Refund Eligibility">
        Refunds for platform-processed payments may be considered when a service is not delivered, is substantially different from what was agreed, or is cancelled before work begins. Each request is reviewed individually.
      </LegalSection>
      <LegalSection heading="4. Non-Refundable Cases">
        Services that have been completed, or cancellations made after work has begun, are generally non-refundable. Disputes about service quality after completion should be raised within 7 days.
      </LegalSection>
      <LegalSection heading="5. Processing Time">
        Approved refunds are typically processed within 5–10 business days to the original payment method.
      </LegalSection>
      <LegalSection heading="6. Contact">
        To request a refund or report an issue, please contact Neighbourhood Labour Connect support with details of the service request.
      </LegalSection>
    </LegalPage>
  );
}