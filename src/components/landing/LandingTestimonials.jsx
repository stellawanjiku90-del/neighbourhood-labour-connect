import React from "react";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  { name: "Sarah M.", location: "Nairobi, Kenya", text: "I found a reliable plumber within 30 minutes. The payment was secure and the service was excellent!", role: "Customer" },
  { name: "James O.", location: "Mombasa, Kenya", text: "This platform changed my life. I get consistent jobs every week and my income has doubled.", role: "Service Provider" },
  { name: "Fatuma A.", location: "Dar es Salaam, Tanzania", text: "As a single mother, finding trustworthy help was hard. Now I can book verified professionals easily.", role: "Customer" },
  { name: "Michael K.", location: "Kampala, Uganda", text: "I started with just one client per month. Now I have a full schedule and regular customers.", role: "Service Provider" },
  { name: "Grace N.", location: "Kigali, Rwanda", text: "The referral program helped me earn extra income while helping friends find quality services.", role: "Customer" },
  { name: "David L.", location: "Lagos, Nigeria", text: "Professional, secure, and easy to use. I've recommended this to all my neighbors.", role: "Customer" },
  { name: "Amina H.", location: "Zanzibar, Tanzania", text: "I can work on my own schedule and the subscription is very affordable. Highly recommend!", role: "Service Provider" },
  { name: "Peter W.", location: "Nakuru, Kenya", text: "From struggling to find clients to running a thriving business. This app is a game-changer.", role: "Service Provider" },
];

export default function LandingTestimonials() {
  return (
    <section className="py-6 md:py-8 px-4 md:px-8 shrink-0">
      <h2 className="font-display font-bold text-foreground text-lg md:text-2xl text-center mb-1">Trusted by Thousands</h2>
      <p className="text-xs md:text-sm text-muted-foreground text-center mb-5">Real stories from real users across Africa</p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 max-w-4xl mx-auto snap-x">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-sm flex-shrink-0 w-[280px] snap-start">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-3 h-3 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-xs text-foreground leading-relaxed mb-3">"{t.text}"</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{t.name.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{t.role} · {t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}