import LegalPage, { LegalSection } from "@/components/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated="June 26, 2026">
      <LegalSection heading="1. Acceptance of Terms">
        By accessing or using Neighbourhood Labour Connect ("we", "us", "our"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the platform.
      </LegalSection>
      <LegalSection heading="2. Our Service">
        Neighbourhood Labour Connect is a marketplace that connects customers with local service providers for household, skilled, and emergency tasks. We facilitate connections but are not a party to any agreement between customers and providers.
      </LegalSection>
      <LegalSection heading="3. User Accounts">
        You must provide accurate information when creating an account and keep your credentials secure. You are responsible for all activity under your account.
      </LegalSection>
      <LegalSection heading="4. Provider Listings">
        Service providers are responsible for the accuracy of their profiles, qualifications, and the services they offer. We do not guarantee the quality, legality, or safety of any service performed.
      </LegalSection>
      <LegalSection heading="5. Prohibited Conduct">
        You agree not to use the platform for unlawful purposes, to harass others, to post false or misleading information, or to interfere with the platform's operation.
      </LegalSection>
      <LegalSection heading="6. Limitation of Liability">
        Neighbourhood Labour Connect is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.
      </LegalSection>
      <LegalSection heading="7. Changes to These Terms">
        We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the revised Terms.
      </LegalSection>
    </LegalPage>
  );
}