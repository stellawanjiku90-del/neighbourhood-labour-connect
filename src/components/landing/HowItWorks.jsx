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
    <section className="py-6 md:py-8 px-4 md:px-8 shrink-0">
      <h2 className="font-display font-bold text-foreground text-lg md:text-2xl text-center mb-1">How It Works</h2>
      <p className="text-xs md:text-sm text-muted-foreground text-center mb-5">From sign-up to done in six simple steps</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
        {STEPS.map((step, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-secondary mx-auto flex items-center justify-center mb-2">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-bold text-foreground">{i + 1}. {step.title}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}