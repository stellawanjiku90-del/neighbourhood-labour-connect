import LegalPage, { LegalSection } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="June 26, 2026">
      <LegalSection heading="1. Information We Collect">
        We collect information you provide directly, such as your name, email, phone number, and profile photo. We also collect location data to match you with nearby service providers, and usage data to improve the platform.
      </LegalSection>
      <LegalSection heading="2. How We Use Your Information">
        We use your information to create and manage your account, connect you with providers or customers, send notifications about jobs and messages, and maintain platform safety.
      </LegalSection>
      <LegalSection heading="3. Sharing of Information">
        We share limited information between customers and providers to facilitate service requests and communication. We do not sell your personal data. We may disclose information when required by law.
      </LegalSection>
      <LegalSection heading="4. Data Security">
        We implement reasonable security measures to protect your information. However, no method of transmission over the internet is completely secure.
      </LegalSection>
      <LegalSection heading="5. Your Rights">
        You may access, update, or delete your account information at any time through the app settings. You can also request deletion of your account and associated data.
      </LegalSection>
      <LegalSection heading="6. Contact">
        If you have questions about this Privacy Policy, please contact Neighbourhood Labour Connect support.
      </LegalSection>
    </LegalPage>
  );
}