/**
 * Disclaimer.
 */

import { Seo } from '@/components/marketing/Seo';

const sections = [
  {
    title: 'Important notice',
    body: 'IDEAL is not a clinical diagnostic tool, medical device or emergency service. The platform is designed solely for clinical documentation, monitoring, escalation support and care-team awareness. It does not replace the clinical judgement, physical examination, assessment or diagnostic decisions of a qualified health professional.',
  },
  {
    title: 'Professional clinical advice',
    body: 'We emphasise that IDEAL does not replace the need for, or reduce the clinical importance of, regular assessments by qualified practitioners. By using the platform, your organisation understands and acknowledges that clinical decisions, treatment plans and interventions must be based on comprehensive, hands-on evaluation by the appropriate registered health professional or clinician responsible for the person’s care.',
  },
  {
    title: 'No absolute guarantees & "as is" delivery',
    body: 'By using IDEAL, your organisation acknowledges that we do not warrant that the platform, alerts, reports, AI-generated summaries or any outputs are absolutely accurate, error-free, complete or delivered within exact guaranteed timeframes. All materials, processing results and services provided through the platform are delivered on an "as is" and "as available" basis, without warranty of any kind, either express or implied, except to the extent required by Australian Consumer Law. Actual performance may vary due to factors outside our reasonable control.',
  },
  {
    title: 'Use at your own risk',
    body: 'Your organisation assumes all risks associated with use of the platform. This includes, but is not limited to, the risk of technical incompatibility, service interruption, data latency, incorrect configuration by authorised users, or potential exposure to device viruses transmitted via third-party integrations or external links. You are responsible for maintaining appropriate contingency processes for clinical documentation during any outage.',
  },
  {
    title: 'Geographic restrictions',
    body: 'IDEAL is currently configured for use by provider organisations operating within Australia. By accessing the platform, you warrant that your organisation is using the platform in connection with Australian disability and aged-care services. We do not represent that the platform or its outputs are legally compliant or appropriate for use in other countries. If you choose to access the platform from outside Australia, you do so entirely at your own risk and are solely responsible for local compliance.',
  },
  {
    title: 'Warranties and indemnity',
    body: 'To the maximum extent permitted by law, all statutory warranties, conditions and liability claims connected to the performance of the platform, or the services accessed through it, are excluded. By accessing this website or using the platform, your organisation agrees to indemnify, defend and hold harmless IDEAL, its directors, employees and affiliates from and against any loss, damage, legal costs or expenses arising from your access to or misuse of the platform.',
  },
  {
    title: 'Right to terminate or restrict access',
    body: 'We reserve the right to restrict, suspend, modify or terminate access to the platform, its services or any specific features at any time, in our sole discretion, without prior notice. IDEAL will not be held liable for any operational losses, data loss or system suspension costs resulting from such service terminations.',
  },
  {
    title: 'Contact',
    body: 'Questions about this disclaimer can be sent to info@idealat.com.au.',
  },
];

export default function Disclaimer() {
  return (
    <>
      <Seo
        title="Disclaimer — IDEAL"
        description="Important disclaimer for users of the IDEAL clinical monitoring platform: not a diagnostic tool, not a substitute for clinical judgement, and provided on an as-is basis."
        path="/disclaimer"
      />
      <section className="site-container max-w-3xl py-16 sm:py-20">
        <span className="eyebrow">Legal</span>
        <h1 className="display-2 mt-5">Disclaimer</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated 2 September 2026</p>
        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-base font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
