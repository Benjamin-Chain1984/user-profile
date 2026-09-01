/**
 * Features page - full capability breakdown.
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/marketing/Seo';
import { howItWorks, primaryFeatures, secondaryFeatures } from '@/data/marketing';

const modules = [
  'Health monitoring & vitals',
  'Bowel care',
  'Continence management',
  'Urinary catheter care',
  'Enteral nutrition',
  'IDDSI & swallowing',
  'Epilepsy monitoring',
  'Pressure area prevention',
  'Pain assessment',
  'Sleep charting',
  'Oral health',
  'Weight & BMI',
  'Fluid balance',
  'Health prevention & screening',
];

export default function Features() {
  return (
    <>
      <Seo
        title="Features — IDEAL assistive technology platform"
        description="Beacon visual cues and alerts, clinical modules, traffic-light risk signals, escalation, role-based access, QR bedside sign-in and audit-ready reporting in one platform."
        path="/features"
      />

      <section className="relative overflow-hidden border-b border-border">
        <div className="glow-bg pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden />
        <div className="site-container relative py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="eyebrow">Features</span>
            <h1 className="display-1 mt-6">Assistive technology for every high-intensity support need</h1>
            <p className="lead mt-6">
              IDEAL — Intelligent Data for Everyday Activities and Lifestyle — pairs clinical
              modules with beacon-driven visual cues and alerts, changing how practice governance
              and support are delivered in disability services and residential aged care. Each
              module ships with the same three tabs — Tracking, Trends and Settings — so staff learn
              the pattern once and apply it everywhere.
            </p>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {primaryFeatures.concat(secondaryFeatures).map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-card transition-colors hover:border-primary/40"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-5 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="site-container site-section">
          <div className="max-w-2xl">
            <span className="eyebrow">Modules</span>
            <h2 className="display-2 mt-5">Enable only what applies</h2>
            <p className="lead mt-4">
              Modules are switched on per client. A disabled module contributes nothing to the
              dashboard, reports or weekly insights.
            </p>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <li
                key={m}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <h2 className="display-2">From sign-up to first log</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((s) => (
              <li key={s.step} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="font-mono text-sm font-bold text-primary">{s.step}</span>
                <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link to="/signup">
                Start your site
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
