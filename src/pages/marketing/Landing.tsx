/**
 * Landing page - primary conversion surface for the IDEAL platform.
 */

import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Seo } from '@/components/marketing/Seo';
import { PricingTable } from '@/components/marketing/PricingTable';
import {
  faqs,
  heroStats,
  howItWorks,
  outcomes,
  primaryFeatures,
  testimonials,
  trustIndicators,
} from '@/data/marketing';
import dashboardMockup from '@/assets/marketing-dashboard.jpg';
import beaconRed from '@/assets/marketing-beacon-red.jpg';

export default function Landing() {
  return (
    <>
      <Seo
        title="IDEAL — Assistive technology for disability & aged care"
        description="Intelligent Data for Everyday Activities and Lifestyle. Beacon-driven visual cues, traffic-light risk signals, escalation alerts and audit-ready reporting — changing how governance and support are delivered."
        path="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'IDEAL',
            description:
              'IDEAL (Intelligent Data for Everyday Activities and Lifestyle) — assistive technology changing how practice governance and support are delivered in disability services and residential aged care.',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'IDEAL',
            applicationCategory: 'HealthApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '999',
              priceCurrency: 'AUD',
              description: 'Per site, per year. Up to five client profiles.',
            },
          },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="glow-bg pointer-events-none absolute inset-x-0 top-0 h-[520px]" aria-hidden />
        <div className="site-container relative pt-16 pb-14 sm:pt-24 sm:pb-20">
          <div className="mx-auto max-w-3xl text-center reveal">
            <span className="eyebrow">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Assistive technology · NDIS High Intensity aligned
            </span>
            <h1 className="display-1 mt-6">
              Intelligent Data for <span className="gradient-text">Everyday Activities and Lifestyle</span>
            </h1>
            <p className="lead mx-auto mt-6 max-w-2xl">
              IDEAL is assistive technology that turns clinical data into visual cues and alerts —
              from the IDEAL Beacon in the home to the traffic-light signal on every screen. It is
              changing the way practice governance and support are delivered in disability services
              and residential aged care.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/signup">
                  Start your site
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/features">See how it works</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              $999 per site per year · up to five clients · unlimited staff accounts
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-elegant">
              <img
                src={dashboardMockup}
                alt="IDEAL dashboard showing clinical module tiles with traffic-light status indicators"
                width={1600}
                height={1008}
                className="w-full rounded-xl"
              />
            </div>
          </div>

          <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {heroStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="font-display text-2xl font-bold sm:text-3xl">{stat.value}</dt>
                <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Assistive technology / Beacon */}
      <section className="border-y border-border bg-card">
        <div className="site-container site-section">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow">The IDEAL Beacon</span>
              <h2 className="display-2 mt-5">Visual cues and alerts, right where care happens</h2>
              <p className="lead mt-4">
                The IDEAL Beacon is a connected light in the home that mirrors each person's live
                status. It gives support workers instant visual cues — no phone, no login, no
                reading charts on a busy shift.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { color: 'bg-success', label: 'Green — on track', text: 'All enabled modules are within their configured ranges.' },
                  { color: 'bg-warning', label: 'Amber — monitor', text: 'Something needs attention soon: a missed check, an overdue task, a borderline reading.' },
                  { color: 'bg-destructive', label: 'Red — act now', text: 'A threshold has been breached. The beacon alerts while the right contacts are notified.' },
                ].map((cue) => (
                  <li key={cue.label} className="flex items-start gap-3">
                    <span className={`mt-1 h-4 w-4 shrink-0 rounded-full ${cue.color}`} aria-hidden />
                    <span className="text-sm">
                      <span className="font-semibold">{cue.label}.</span>{' '}
                      <span className="text-muted-foreground">{cue.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-background p-8 shadow-card">
              <h3 className="text-base font-semibold">A new model of practice governance</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                IDEAL changes how governance and support are delivered in disability services and
                residential aged care. Configuration set by clinicians flows straight to the floor —
                as logging forms, schedules, beacon cues and escalation alerts — and every action
                flows back as an audit-ready record.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Managers see every client's IDEAL signal on one screen. Staff see exactly what to do
                next. Nothing relies on memory, handover notes or a shared folder again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-background">
        <div className="site-container py-14 sm:py-16">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Built for disability services, residential aged care and community nursing teams
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {trustIndicators.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.quote}
                className="flex h-full flex-col rounded-2xl border border-border bg-background p-6 shadow-card"
              >
                <div className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold">{t.name}</span>
                  <span className="block text-muted-foreground">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="site-section">
        <div className="site-container">
          <div className="max-w-2xl">
            <span className="eyebrow">Platform</span>
            <h2 className="display-2 mt-5">Everything a high-intensity support team needs</h2>
            <p className="lead mt-4">
              Enable only the modules that apply to each person. Configure thresholds once, and the
              logging forms, schedules and alerts follow automatically.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {primaryFeatures.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card">
        <div className="site-container site-section">
          <div className="max-w-2xl">
            <span className="eyebrow">How it works</span>
            <h2 className="display-2 mt-5">Live in an afternoon, not a quarter</h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((s) => (
              <li key={s.step} className="rounded-2xl border border-border bg-background p-6">
                <span className="font-mono text-sm font-bold text-primary">{s.step}</span>
                <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Results */}
      <section className="site-section">
        <div className="site-container">
          <div className="rounded-3xl border border-border gradient-surface p-8 text-primary-foreground sm:p-12">
            <h2 className="display-2">Outcomes teams report</h2>
            <p className="mt-3 max-w-2xl text-primary-foreground/80">
              Less time on paperwork, faster escalation, and documentation that stands up to review.
            </p>
            <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {outcomes.map((o) => (
                <div key={o.label}>
                  <dt className="font-display text-3xl font-extrabold">{o.value}</dt>
                  <dd className="mt-2 text-sm text-primary-foreground/80">{o.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="border-t border-border bg-card">
        <div className="site-container site-section">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Pricing</span>
            <h2 className="display-2 mt-5">Simple annual pricing per site</h2>
            <p className="lead mt-4">
              Start with one site and five clients. Scale to unlimited sites when you are ready.
            </p>
          </div>
          <div className="mt-12">
            <PricingTable compact />
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/pricing">Compare plans in full</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="site-section">
        <div className="site-container max-w-3xl">
          <div className="text-center">
            <span className="eyebrow">FAQ</span>
            <h2 className="display-2 mt-5">Questions, answered</h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-card">
        <div className="site-container py-20 text-center sm:py-24">
          <h2 className="display-2">Give your team one screen they can trust</h2>
          <p className="lead mx-auto mt-4 max-w-xl">
            Set up your site, invite your team and start monitoring today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/signup">
                Start your site
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Book a walkthrough</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
