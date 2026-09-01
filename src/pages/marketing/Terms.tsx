/**
 * Terms of Service.
 */

import { Seo } from '@/components/marketing/Seo';

const sections = [
  {
    title: '1. Agreement',
    body: 'These Terms of Service govern your access to and use of the IDEAL platform. By creating an account or using the platform, you agree to these terms on behalf of yourself and the organisation you represent.',
  },
  {
    title: '2. The service',
    body: 'IDEAL provides clinical documentation, monitoring, escalation and reporting tools for disability and aged-care providers. IDEAL is not a medical device, not a diagnostic tool, and not an emergency service. It does not replace clinical judgement, a registered practitioner’s assessment, or emergency care.',
  },
  {
    title: '3. Accounts and access',
    body: 'You are responsible for the accuracy of the accounts you create, for assigning appropriate roles, and for ensuring only authorised staff access client records. You must notify us promptly of any suspected unauthorised access.',
  },
  {
    title: '4. Subscriptions and billing',
    body: 'Subscriptions are billed annually per site in advance. Starter covers one site and up to five client profiles. Professional and Enterprise plans are as described on the pricing page or in your written agreement. Prices are in Australian dollars and include GST where applicable.',
  },
  {
    title: '5. Cancellation and refunds',
    body: 'You may cancel at any time from the billing page. Cancellation stops future renewals; the current paid period continues until its end date. Fees already paid for the current period are non-refundable unless required by Australian Consumer Law.',
  },
  {
    title: '6. Your data',
    body: 'You retain ownership of all clinical and personal data you enter. We process it only to provide the service, as described in the Privacy Policy. You are the entity responsible for obtaining any consents required to record and store that information.',
  },
  {
    title: '7. Acceptable use',
    body: 'You must not misuse the platform, attempt to access records outside your authorisation, reverse engineer the service, or use it in any way that breaches applicable law, professional obligations or NDIS practice standards.',
  },
  {
    title: '8. Availability',
    body: 'We aim for high availability but do not guarantee uninterrupted service. Planned maintenance is communicated where practical. You must maintain appropriate contingency processes for clinical documentation during any outage.',
  },
  {
    title: '9. Limitation of liability',
    body: 'To the extent permitted by law, our aggregate liability arising from the service is limited to the fees paid by you in the twelve months preceding the claim. We are not liable for clinical decisions made by your staff or third parties.',
  },
  {
    title: '10. Changes',
    body: 'We may update these terms to reflect changes in the service or the law. Material changes will be notified in-app or by email before they take effect.',
  },
  {
    title: '11. Contact',
    body: 'Questions about these terms can be sent to hello@idealcare.app.',
  },
];

export default function Terms() {
  return (
    <>
      <Seo
        title="Terms of Service — IDEAL"
        description="The terms governing use of the IDEAL clinical monitoring platform, including subscriptions, cancellation, data ownership and acceptable use."
        path="/terms"
      />
      <section className="site-container max-w-3xl py-16 sm:py-20">
        <span className="eyebrow">Legal</span>
        <h1 className="display-2 mt-5">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated 1 September 2026</p>
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
