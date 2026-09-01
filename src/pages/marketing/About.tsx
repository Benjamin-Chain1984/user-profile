/**
 * About page.
 */

import { Link } from 'react-router-dom';
import { Compass, HeartHandshake, ShieldCheck, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/marketing/Seo';

const values = [
  {
    icon: ShieldCheck,
    title: 'Safety first, always',
    description:
      'Every module carries clinical safety guidance. If configuration is missing, the status goes Amber — never green by assumption.',
  },
  {
    icon: Target,
    title: 'Built for the shift, not the audit',
    description:
      'If a support worker cannot log it in under thirty seconds on a phone, we redesign it.',
  },
  {
    icon: Compass,
    title: 'One source of truth',
    description:
      'Clinical settings live in the module. Forms, schedules, alerts and reports all follow that configuration.',
  },
  {
    icon: HeartHandshake,
    title: 'Dignity in the detail',
    description:
      'Calm visuals, plain language and person-centred records — the people being supported come before the software.',
  },
];

export default function About() {
  return (
    <>
      <Seo
        title="About IDEAL — clinical monitoring built with support teams"
        description="IDEAL was built with nurses, support workers and practice leads to make high-intensity health monitoring safer, simpler and audit-ready."
        path="/about"
      />

      <section className="relative overflow-hidden border-b border-border">
        <div className="glow-bg pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden />
        <div className="site-container relative py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="eyebrow">About</span>
            <h1 className="display-1 mt-6">We build the tool we wished we had on shift</h1>
            <p className="lead mt-6">
              IDEAL started as a clinical practice problem, not a software idea. High-intensity
              supports were documented across paper charts, spreadsheets and message threads, which
              meant deterioration was often obvious only in hindsight.
            </p>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="display-2">Our mission</h2>
            <p className="lead mt-4">
              Make the health status of every supported person visible at a glance, and make the
              right next action obvious to whoever is on shift.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We design against NDIS High Intensity Skills Descriptors and established clinical
              tools — the Bristol stool chart, IDDSI framework, ILAE seizure classifications, Abbey
              Pain Scale and PAINAD — so records translate directly into the language clinicians and
              auditors already use.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              IDEAL supports documentation, monitoring and escalation. It is not a medical device and
              never replaces clinical judgement or emergency services.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="site-container py-16 text-center">
          <h2 className="display-2">Want to see it with your own care model?</h2>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/contact">Book a walkthrough</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
