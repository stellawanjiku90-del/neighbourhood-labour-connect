import React from "react";
import { UserPlus, FileText, Users, MessageCircle, CheckCircle2, Star } from "lucide-react";

const STEPS = [
  { icon: UserPlus, title: "Register", desc: "Sign up as a customer or service provider in seconds." },
  { icon: FileText, title: "Post a Job or Offer a Service", desc: "Customers post jobs; providers list their skills." },
  { icon: Users, title: "Get Matched", desc: "Connect with the right person nearby instantly." },
  { icon: MessageCircle, title: "Chat Securely", desc: "Message directly within the app — no sharing numbers." },
  { icon: CheckCircle2, title: "Complete the Job", desc: "Track progress in real time until the job is done." },
  { icon: Star, title: "Get Paid or Leave a Review", desc: "Secure payments and honest ratings after every job." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-6 py-10 md:py-14 px-5 md:px-10 shrink-0">
      <h2 className="font-display font-bold text-foreground text-2xl md:text-3xl text-center mb-3">How It Works</h2>
      <p className="text-sm md:text-base text-muted-foreground text-center mb-8">From sign-up to done in six simple steps</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
        {STEPS.map((step, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-4 md:p-5 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center mb-2">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">{i + 1}. {step.title}</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}