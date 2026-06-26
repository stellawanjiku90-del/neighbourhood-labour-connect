import React from "react";

const STEPS = [
  { step: "1", title: "Post a job", desc: "Tell us what you need done and when." },
  { step: "2", title: "Get offers", desc: "Local pros reach out with their rates." },
  { step: "3", title: "Get it done", desc: "Pick your pro, chat, and get it sorted." },
];

export default function HowItWorks() {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-foreground mb-4">How it works</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {STEPS.map((s) => (
          <div key={s.step} className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm mb-2">
              {s.step}
            </div>
            <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}