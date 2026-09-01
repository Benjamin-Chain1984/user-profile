/**
 * Privacy Policy.
 */

import { Seo } from '@/components/marketing/Seo';

const sections = [
  {
    title: '1. Who we are',
    body: 'IDEAL provides clinical monitoring software to disability and aged-care providers. Where your organisation records information about the people it supports, your organisation is the entity responsible for that information and IDEAL processes it on your behalf.',
  },
  {
    title: '2. Information we collect',
    body: 'Account information (name, email, mobile number, role), client records your staff enter (health observations, schedules, care configuration, photos where uploaded), and technical information such as device identifiers used for trusted-device sign-in, log timestamps and audit events.',
  },
  {
    title: '3. How we use information',
    body: 'To operate the platform, authenticate users, calculate clinical status and alerts, deliver notifications to nominated contacts, generate reports and weekly summaries, maintain audit trails, and provide support. We do not sell personal information and do not use clinical records for advertising.',
  },
  {
    title: '4. Automated insights',
    body: 'Weekly health summaries are generated from the client’s enabled modules only. These summaries are decision support for qualified staff and are never a substitute for clinical assessment.',
  },
  {
    title: '5. Sharing',
    body: 'We share information with infrastructure and communications providers strictly as needed to run the service (hosting and database, email delivery, SMS delivery for one-time codes, and payment processing for subscriptions). These providers act under contract and may not use the data for their own purposes.',
  },
  {
    title: '6. Security',
    body: 'Access is controlled by role-based permissions and row-level database policies, so records are only visible to authorised staff assigned to that client. Data is encrypted in transit and at rest. Staff sign-in supports one-time codes and a trusted-device cycle. Clinical actions are recorded in an immutable audit log.',
  },
  {
    title: '7. Retention',
    body: 'Clinical records are retained while your subscription is active and for the period your organisation’s record-keeping obligations require. On written request after cancellation we will export and then delete your data.',
  },
  {
    title: '8. Your rights',
    body: 'Individuals may request access to, or correction of, the personal information held about them. Requests should be made to the provider organisation that holds the record; we assist providers in responding.',
  },
  {
    title: '9. Cookies and local storage',
    body: 'We use essential storage only — to keep you signed in, remember your active client profile and theme preference, and support trusted devices. We do not use third-party advertising trackers.',
  },
  {
    title: '10. Contact',
    body: 'Privacy questions and requests can be sent to privacy@idealcare.app.',
  },
];

export default function Privacy() {
  return (
    <>
      <Seo
        title="Privacy Policy — IDEAL"
        description="How IDEAL collects, uses, secures and retains account and clinical information, including role-based access, audit trails and data retention."
        path="/privacy"
      />
      <section className="site-container max-w-3xl py-16 sm:py-20">
        <span className="eyebrow">Legal</span>
        <h1 className="display-2 mt-5">Privacy Policy</h1>
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
