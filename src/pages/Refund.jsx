import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Refund() {
  return (
    <div className="h-[100dvh] overflow-y-auto max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Refund Policy</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated: June 26, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-bold mb-2">1. Overview</h2>
          <p className="text-muted-foreground">
            Neighbourhood Labour Connect facilitates connections between customers and service providers. Payments for services are arranged directly between the parties unless processed through the platform.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">2. Service Disputes</h2>
          <p className="text-muted-foreground">
            If a service is not performed as agreed, customers should first attempt to resolve the issue directly with the provider. If unresolved, you may report the issue through the app for review.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">3. Refund Eligibility</h2>
          <p className="text-muted-foreground">
            Refunds for platform-processed payments may be considered when a service is not delivered, is substantially different from what was agreed, or is cancelled before work begins. Each request is reviewed individually.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">4. Non-Refundable Cases</h2>
          <p className="text-muted-foreground">
            Services that have been completed, or cancellations made after work has begun, are generally non-refundable. Disputes about service quality after completion should be raised within 7 days.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">5. Processing Time</h2>
          <p className="text-muted-foreground">
            Approved refunds are typically processed within 5–10 business days to the original payment method.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">6. Contact</h2>
          <p className="text-muted-foreground">
            To request a refund or report an issue, please contact Neighbourhood Labour Connect support with details of the service request.
          </p>
        </section>
      </div>
    </div>
  );
}