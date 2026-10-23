import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PATHS = [
  {
    id: "for-customers",
    title: "Looking for help?",
    description: "Find someone for the work you need done.",
    to: "/auth?role=customer",
    action: "Find a professional",
    steps: [
      "Create an account with your phone number.",
      "Browse local professionals, or post a job when you need help.",
      "Chat to agree on the details and keep track of the work.",
    ],
    note: "A subscription is needed to post a job. Browsing providers is available after sign-in.",
  },
  {
    id: "for-professionals",
    title: "Offering a service?",
    description: "Show people nearby what you can do.",
    to: "/auth?role=provider",
    action: "Find local work",
    steps: [
      "Create a profile with your skills and location.",
      "Choose a plan to list your services and respond to jobs.",
      "Chat with customers, complete the work, and track your earnings.",
    ],
    note: "You can review the available plan before paying.",
  },
];

function GettingStartedCard({ path }) {
  return (
    <article id={path.id} className="flex h-full flex-col rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <h3 className="font-display text-2xl font-bold text-foreground">{path.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{path.description}</p>
      </div>

      <ol className="space-y-5">
        {path.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
              {index + 1}
            </span>
            <span className="pt-0.5 text-sm leading-relaxed text-foreground">{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        {path.note}
      </p>

      <Button asChild className="mt-6 h-11 w-full rounded-xl text-sm font-semibold sm:w-auto">
        <Link to={path.to}>{path.action}</Link>
      </Button>
    </article>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-6 border-t border-border bg-secondary/20 px-5 py-14 md:px-10 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-primary">Getting started</p>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Choose the path that fits you.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            The steps are a little different depending on whether you need help or offer a service.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {PATHS.map((path) => <GettingStartedCard key={path.id} path={path} />)}
        </div>
      </div>
    </section>
  );
}
