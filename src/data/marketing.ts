/**
 * Marketing site content — single source of truth for the public website.
 */

import {
  Activity,
  BellRing,
  ClipboardCheck,
  FileBarChart,
  Fingerprint,
  HeartPulse,
  Lightbulb,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface MarketingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const heroStats = [
  { value: '17', label: 'Clinical modules' },
  { value: 'Beacon', label: 'Visual cues & alerts' },
  { value: '24/7', label: 'Escalation cover' },
  { value: 'NDIS', label: 'Aligned practice' },
];

export const primaryFeatures: MarketingFeature[] = [
  {
    icon: Lightbulb,
    title: 'The IDEAL Beacon — visual cues at the point of care',
    description:
      'A connected beacon in the home gives instant visual cues and alerts. Green means on track, Amber means something needs attention, Red means act now — visible from across the room, no screen required.',
  },
  {
    icon: HeartPulse,
    title: 'Clinical modules that cover the whole person',
    description:
      'Bowel care, continence, catheter, epilepsy, pressure areas, IDDSI, enteral nutrition, sleep, pain, vitals and more — each with tracking, trends and settings.',
  },
  {
    icon: Activity,
    title: 'The IDEAL signal at a glance',
    description:
      'Every client rolls up to one high-contrast traffic light. Red always wins over Amber, so the risk that matters is never buried in a list.',
  },
  {
    icon: BellRing,
    title: 'Escalation that actually reaches someone',
    description:
      'Amber and Red thresholds notify the right contacts per module, with a global pause for planned exceptions and a full notification history.',
  },
  {
    icon: ClipboardCheck,
    title: 'Audit-ready by default',
    description:
      'Automatic staff attribution on every clinical log, soft-delete undo, and local-time stamping that never drifts across day boundaries.',
  },
  {
    icon: QrCode,
    title: 'Bedside access in seconds',
    description:
      'Printable QR posters and SMS OTP sign-in put the right record in front of the right worker without a shared password in sight.',
  },
  {
    icon: FileBarChart,
    title: 'Reports clinicians accept',
    description:
      'Professional PDF and CSV exports per module, plus AI weekly insights summarising the last seven days across active modules only.',
  },
];

export const secondaryFeatures: MarketingFeature[] = [
  {
    icon: ShieldCheck,
    title: 'Role-based access control',
    description:
      'Support workers see instructions and logging. Clinicians and admins hold configuration, thresholds and reporting.',
  },
  {
    icon: Users,
    title: 'Multi-client, multi-site',
    description:
      'Switch between client profiles instantly. Every query is scoped to the active client, so records never bleed across people.',
  },
  {
    icon: Fingerprint,
    title: 'Trusted devices and MFA',
    description:
      '90-day trusted-device cycles, phone sessions and verified numbers keep mobile access convenient without loosening control.',
  },
  {
    icon: Workflow,
    title: 'Customisable in minutes',
    description:
      'Every module is configured in its own Settings tab — thresholds, schedules and alert contacts. Enable a module and it is ready for staff to use within minutes.',
  },
  {
    icon: Sparkles,
    title: 'Practical AI assistance',
    description:
      'Retrospective weekly summaries highlight patterns across enabled modules — never a substitute for clinical judgement.',
  },
  {
    icon: ClipboardCheck,
    title: 'Print-ready at the point of care',
    description:
      'A4 IDDSI placemats, choking first-aid workflows and client access posters print exactly as designed.',
  },
];

export const howItWorks = [
  {
    step: '01',
    title: 'Create your site',
    description: 'Sign up, name your organisation and invite your team with the roles they need.',
  },
  {
    step: '02',
    title: 'Add clients',
    description: 'Each new client profile starts completely blank — no assumed data, nothing pre-filled.',
  },
  {
    step: '03',
    title: 'Enable modules',
    description: 'Turn on only the clinical modules that apply, then configure thresholds in module settings.',
  },
  {
    step: '04',
    title: 'Monitor and escalate',
    description: 'Staff log at the point of care while the IDEAL signal and alerts surface what needs action.',
  },
];

export const outcomes = [
  { value: '< 30s', label: 'To log a clinical event at the bedside' },
  { value: '100%', label: 'Of clinical entries carry staff attribution' },
  { value: '1 screen', label: 'To see every client’s risk status' },
  { value: '0', label: 'Shared passwords needed for QR access' },
];

export const testimonials = [
  {
    quote:
      'The traffic lights changed our handover. Team leaders open one screen and know exactly which person needs attention first.',
    name: 'Clinical Nurse Consultant',
    role: 'Supported independent living provider',
  },
  {
    quote:
      'Bowel care and catheter documentation used to live in three folders. Now it is one configured module with a real audit trail.',
    name: 'Practice Quality Lead',
    role: 'Multi-site disability service',
  },
  {
    quote:
      'Support workers scan the poster, verify by SMS and log straight away. Compliance went up because it finally got easier.',
    name: 'Service Manager',
    role: 'Aged care and disability group',
  },
];

export const trustIndicators = [
  'Assistive technology for high-intensity supports',
  'NDIS High Intensity aligned',
  'Beacon visual cues & alerts',
  'Role-based access control',
  'Full audit trail',
  'Australian data practices',
];

export interface Plan {
  id: 'starter' | 'professional' | 'enterprise';
  name: string;
  price: string;
  cadence: string;
  summary: string;
  highlight?: boolean;
  cta: string;
  features: string[];
}

export const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$999',
    cadence: 'per site / year',
    summary: 'One site, up to five clients. Everything you need to run monitoring properly.',
    cta: 'Start with Starter',
    features: [
      '1 site',
      'Up to 5 client profiles',
      'All clinical modules',
      'Unlimited staff accounts',
      'QR + SMS OTP bedside access',
      'PDF and CSV reporting',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$2,499',
    cadence: 'per year',
    summary: 'Growing providers running several houses with shared clinical governance.',
    highlight: true,
    cta: 'Choose Professional',
    features: [
      'Up to 3 sites',
      'Up to 15 client profiles',
      'Everything in Starter',
      'AI weekly health insights',
      'Advanced escalation routing',
      'Team competency tracking',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual agreement',
    summary: 'Unlimited sites, tailored governance, onboarding and integration support.',
    cta: 'Talk to us',
    features: [
      'Unlimited sites and clients',
      'Everything in Professional',
      'SSO and directory integration',
      'IoT / wearable data pipeline',
      'Custom reporting packs',
      'Dedicated onboarding',
      'Named account manager',
    ],
  },
];

export const faqs = [
  {
    q: 'How is IDEAL priced?',
    a: 'Starter is $999 per site per year and covers up to five client profiles with unlimited staff accounts. Professional covers up to three sites and fifteen clients. Enterprise is an annual agreement scoped to your organisation.',
  },
  {
    q: 'Is IDEAL a medical device?',
    a: 'No. IDEAL is a documentation, monitoring and escalation support tool. It never replaces clinical judgement, and every module carries clear safety guidance directing staff to the relevant health professional.',
  },
  {
    q: 'Who configures the clinical thresholds?',
    a: 'Clinicians and admins configure each module in its Settings tab. Support workers see the resulting instructions and logging forms, but cannot change configuration.',
  },
  {
    q: 'Can support workers use it on a phone?',
    a: 'Yes. The application is mobile-first. Workers scan the client QR poster, verify with an SMS one-time code and log at the point of care on a trusted device.',
  },
  {
    q: 'What happens to data if we cancel?',
    a: 'Your records remain exportable during the subscription period. You can export full PDF and CSV reports per module at any time before access ends.',
  },
  {
    q: 'Do you support NDIS reporting requirements?',
    a: 'Modules are built around NDIS High Intensity Skills Descriptors, including bowel care, enteral feeding, urinary catheter management, epilepsy and severe dysphagia.',
  },
];

export const footerNav = {
  product: [
    { label: 'Features', to: '/features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Sign in', to: '/login' },
    { label: 'Create account', to: '/signup' },
  ],
  company: [
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ],
  legal: [
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Privacy Policy', to: '/privacy' },
  ],
};
