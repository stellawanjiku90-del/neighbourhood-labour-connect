import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="h-full overflow-y-auto max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated: June 26, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-bold mb-2">1. Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect information you provide directly, such as your name, email, phone number, and profile photo. We also collect location data to match you with nearby service providers, and usage data to improve the platform.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use your information to create and manage your account, connect you with providers or customers, send notifications about jobs and messages, and maintain platform safety.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">3. Sharing of Information</h2>
          <p className="text-muted-foreground">
            We share limited information between customers and providers to facilitate service requests and communication. We do not sell your personal data. We may disclose information when required by law.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">4. Data Security</h2>
          <p className="text-muted-foreground">
            We implement reasonable security measures to protect your information. However, no method of transmission over the internet is completely secure.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">5. Your Rights</h2>
          <p className="text-muted-foreground">
            You may access, update, or delete your account information at any time through the app settings. You can also request deletion of your account and associated data.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">6. Contact</h2>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy, please contact Neighbourhood Labour Connect support.
          </p>
        </section>
      </div>
    </div>
  );
}