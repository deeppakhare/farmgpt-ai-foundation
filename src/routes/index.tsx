import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight, Sparkles, ScanLine, CloudSun, Landmark, LineChart,
  MessageSquare, ShieldCheck, Zap, Globe, Check,
  Mail, MapPin, Linkedin, Github, Twitter, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/farmgpt/Logo";
import { supabase } from "@/integrations/supabase/client";
import { clearAuthRedirectParams, completeAuthRedirect, hasAuthRedirectParams } from "@/lib/auth-redirect";
import { toast } from "sonner";
import { z } from "zod";
import heroImg from "@/assets/hero-farm.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmGPT AI — AI for Indian Farmers" },
      { name: "description", content: "AI-powered guidance built for Indian farmers. Diagnose crop disease, get weather-aware advice, mandi prices and government schemes — in your language." },
      { property: "og:title", content: "FarmGPT AI — AI for Indian Farmers" },
      { property: "og:description", content: "The AI operating system for Indian agriculture." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: MessageSquare, title: "AI Chat Assistant", desc: "Ask anything about your farm — in Hindi, Marathi, Kannada, Tamil, Telugu or English." },
  { icon: ScanLine, title: "Crop Disease Scanner", desc: "Snap a leaf. FarmGPT identifies the disease and suggests a remedy that works in India." },
  { icon: CloudSun, title: "Monsoon & Weather", desc: "Hyperlocal IMD-aware forecasts for smarter irrigation, spraying and harvest." },
  { icon: Landmark, title: "Govt. Schemes (PM-KISAN, PMFBY)", desc: "Discover Kisan schemes, subsidies and insurance you actually qualify for." },
  { icon: LineChart, title: "Mandi Prices", desc: "Track real mandi rates across states and get sell-timing signals for your crop." },
  { icon: ShieldCheck, title: "Private by Design", desc: "Your farm data stays yours. End-to-end encryption on every conversation." },
];

const STEPS = [
  { n: "01", t: "Set up your farm", d: "Tell FarmGPT about your crops, soil and district. Takes under a minute." },
  { n: "02", t: "Ask or upload", d: "Type a question, upload a photo of a leaf, or use voice — in your language." },
  { n: "03", t: "Act with confidence", d: "Get a clear recommendation with reasoning tailored to Indian conditions." },
];

const BENEFITS = [
  "Reduce crop loss with early disease detection",
  "Save water with smart irrigation timing",
  "Unlock Kisan subsidies you didn't know existed",
  "Sell at the right price with live mandi signals",
  "Works in हिन्दी, मराठी, ಕನ್ನಡ, தமிழ், తెలుగు & English",
  "One workspace for every farming decision",
];

const TESTIMONIALS = [
  { n: "Anita S.", r: "Cotton farmer, Maharashtra", q: "FarmGPT caught leaf curl on my crop three days before I would have. Saved half my season." },
  { n: "Manoj P.", r: "Tomato grower, Karnataka", q: "It feels like having an agronomist in my pocket. And it speaks Kannada." },
  { n: "Devi R.", r: "Paddy farmer, Tamil Nadu", q: "Simple, fast, honest advice. I open FarmGPT every morning before I step into the field." },
];

const FAQ = [
  { q: "Is FarmGPT free to use?", a: "Yes, you can start free. Premium unlocks advanced disease detection, mandi forecasts and unlimited chat history." },
  { q: "Does it work in Indian languages?", a: "Yes. FarmGPT supports English, Hindi, Marathi, Kannada, Tamil and Telugu out of the box, with more coming." },
  { q: "Do I need internet all the time?", a: "You need internet for AI features, but essential info like weather and past reports are cached for offline access." },
  { q: "How accurate is the disease detection?", a: "Our models are trained on lakhs of field images from Indian farms and reach 90%+ accuracy on common crops. Always confirm major decisions with an expert." },
  { q: "Is my data safe?", a: "Yes. Conversations are encrypted, we never sell your data, and you can delete everything with one click." },
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(5, "Please write a short message").max(2000),
});

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("Could not send message. Please try again.");
      return;
    }
    toast.success("Thanks! Your message has been sent.");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <form onSubmit={onSubmit} className="glass rounded-2xl p-6 md:p-8 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" maxLength={255} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" rows={5} maxLength={2000} />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : "Send message"}
      </Button>
    </form>
  );
}

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const goToDashboard = () => navigate({ to: "/dashboard", replace: true });

    async function finishPendingSignIn() {
      if (hasAuthRedirectParams()) {
        const result = await completeAuthRedirect();
        if (!active) return;
        clearAuthRedirectParams("/");
        if (result.ok) {
          goToDashboard();
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (active && data.session) goToDashboard();
    }

    finishPendingSignIn();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        goToDashboard();
      }
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground">Testimonials</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/register"><Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,oklch(1_0_0_/_0.08)_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
            <div className="glass mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Built for Indian farmers 🇮🇳
            </div>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] font-semibold tracking-tight md:text-7xl">
              AI that speaks<br /><span className="text-gradient">your farm's</span> language.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              FarmGPT AI helps Indian farmers diagnose crop diseases, plan around the monsoon, track mandi prices and discover Kisan schemes — all in one place, in your language.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="h-12 gap-2 rounded-full bg-gradient-primary px-6 text-primary-foreground shadow-glow hover:opacity-95">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline" className="h-12 rounded-full px-6">Learn more</Button>
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative mx-auto mt-14 max-w-5xl">
            <div className="glass overflow-hidden rounded-2xl shadow-glow">
              <img src={heroImg} alt="Indian farmer using FarmGPT AI on a smartphone in a paddy field" width={1600} height={1200} className="w-full object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <div className="text-xs font-medium tracking-widest text-accent uppercase">Features</div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">Everything an Indian farm needs, in one chat.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <Card className="glass h-full border-0 transition-transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="inline-flex rounded-xl bg-gradient-primary p-2.5 shadow-glow">
                      <f.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <div className="text-xs font-medium tracking-widest text-accent uppercase">How it works</div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">From question to decision, in seconds.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <Card key={s.n} className="glass border-0">
                <CardContent className="p-6">
                  <div className="text-gradient font-display text-4xl font-semibold">{s.n}</div>
                  <h3 className="mt-3 font-display text-lg font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border/60 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-xs font-medium tracking-widest text-accent uppercase">Benefits</div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">Grow more. Waste less. Sleep better.</h2>
            <p className="mt-4 text-muted-foreground">FarmGPT is designed with Indian agronomists, engineers and farmers — so the advice is grounded, timely, and truly useful in the field.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register"><Button className="bg-gradient-primary text-primary-foreground shadow-glow"><Zap className="mr-2 h-4 w-4" />Try FarmGPT free</Button></Link>
              <Link to="/dashboard"><Button variant="outline"><Globe className="mr-2 h-4 w-4" />See the workspace</Button></Link>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b} className="glass flex items-start gap-3 rounded-xl p-4">
                <div className="mt-0.5 rounded-full bg-accent/20 p-1 text-accent"><Check className="h-3.5 w-3.5" /></div>
                <span className="text-sm">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-t border-border/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <div className="text-xs font-medium tracking-widest text-accent uppercase">Loved by farmers</div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">Real farms. Real results.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.n} className="glass border-0">
                <CardContent className="p-6">
                  <p className="text-sm leading-relaxed">"{t.q}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{t.n.split(" ").map(s => s[0]).join("")}</AvatarFallback></Avatar>
                    <div>
                      <div className="text-sm font-medium">{t.n}</div>
                      <div className="text-xs text-muted-foreground">{t.r}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="text-xs font-medium tracking-widest text-accent uppercase">FAQ</div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">Questions, answered.</h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className="border-border/60">
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <div className="text-xs font-medium tracking-widest text-accent uppercase">Contact</div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">Let's talk.</h2>
            <p className="mt-4 text-muted-foreground">Questions, partnerships, or feedback from the field — drop a message and we'll get back to you.</p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <a href="mailto:deeppakhare19@gmail.com" className="glass flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-accent/5">
                <div className="rounded-lg bg-gradient-primary p-2.5 shadow-glow"><Mail className="h-5 w-5 text-primary-foreground" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-medium">deeppakhare19@gmail.com</div>
                </div>
              </a>
              <div className="glass flex items-center gap-4 rounded-xl p-4">
                <div className="rounded-lg bg-gradient-primary p-2.5 shadow-glow"><MapPin className="h-5 w-5 text-primary-foreground" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Based in</div>
                  <div className="text-sm font-medium">Pune, Maharashtra 🇮🇳</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <a href="https://www.linkedin.com/in/deeppakhare6669/" target="_blank" rel="noopener noreferrer" className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors hover:bg-accent/10">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
                <a href="https://github.com/deeppakhare" target="_blank" rel="noopener noreferrer" className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors hover:bg-accent/10">
                  <Github className="h-4 w-4" /> GitHub
                </a>
                <a href="https://x.com/deep_pakhare" target="_blank" rel="noopener noreferrer" className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors hover:bg-accent/10">
                  <Twitter className="h-4 w-4" /> Twitter / X
                </a>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4">
          <div className="glass relative overflow-hidden rounded-3xl p-10 text-center md:p-14">
            <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-70" />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">Ready to farm with an AI on your side?</h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Set up in under a minute. No credit card required.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/register"><Button size="lg" className="h-12 gap-2 rounded-full bg-gradient-primary px-6 text-primary-foreground shadow-glow">Start free <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link to="/login"><Button size="lg" variant="outline" className="h-12 rounded-full px-6">Sign in</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <Logo />
          <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} FarmGPT AI. Built in Pune, India.</div>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <a href="#contact" className="hover:text-foreground">Contact</a>
            <a href="https://github.com/deeppakhare" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
            <a href="https://www.linkedin.com/in/deeppakhare6669/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
