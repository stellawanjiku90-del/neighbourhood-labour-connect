import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Terms & Conditions</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated: June 26, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-bold mb-2">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using Neighbourhood Labour Connect ("Labour Connect", "we", "us"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the platform.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">2. Our Service</h2>
          <p className="text-muted-foreground">
            Labour Connect is a marketplace that connects customers with local service providers for household, skilled, and emergency tasks. We facilitate connections but are not a party to any agreement between customers and providers.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">3. User Accounts</h2>
          <p className="text-muted-foreground">
            You must provide accurate information when creating an account and keep your credentials secure. You are responsible for all activity under your account.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">4. Provider Listings</h2>
          <p className="text-muted-foreground">
            Service providers are responsible for the accuracy of their profiles, qualifications, and the services they offer. We do not guarantee the quality, legality, or safety of any service performed.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">5. Prohibited Conduct</h2>
          <p className="text-muted-foreground">
            You agree not to use the platform for unlawful purposes, to harass others, to post false or misleading information, or to interfere with the platform's operation.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">6. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            Labour Connect is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">7. Changes to These Terms</h2>
          <p className="text-muted-foreground">
            We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the revised Terms.
          </p>
        </section>
      </div>
    </div>
  );
}