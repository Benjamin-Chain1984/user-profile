/**
 * Pricing page - plan comparison and billing FAQ.
 */

import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Seo } from '@/components/marketing/Seo';
import { PricingTable } from '@/components/marketing/PricingTable';
import { faqs } from '@/data/marketing';

const comparison: { feature: string; starter: string | boolean; professional: string | boolean; enterprise: string | boolean }[] = [
  { feature: 'Sites included', starter: '1', professional: 'Up to 3', enterprise: 'Unlimited' },
  { feature: 'Client profiles', starter: 'Up to 5', professional: 'Up to 15', enterprise: 'Unlimited' },
  { feature: 'Staff accounts', starter: 'Unlimited', professional: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'All clinical modules', starter: true, professional: true, enterprise: true },
  { feature: 'QR + SMS OTP bedside access', starter: true, professional: true, enterprise: true },
  { feature: 'PDF & CSV reporting', starter: true, professional: true, enterprise: true },
  { feature: 'AI weekly health insights', starter: false, professional: true, enterprise: true },
  { feature: 'Advanced escalation routing', starter: false, professional: true, enterprise: true },
  { feature: 'Competency tracking', starter: false, professional: true, enterprise: true },
  { feature: 'SSO / directory integration', starter: false, professional: false, enterprise: true },
  { feature: 'IoT / wearable pipeline', starter: false, professional: false, enterprise: true },
  { feature: 'Dedicated onboarding', starter: false, professional: false, enterprise: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'string') return <span className="text-sm">{value}</span>;
  return value ? (
    <Check className="h-4 w-4 text-success" aria-label="Included" />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground" aria-label="Not included" />
  );
}

export default function Pricing() {
  return (
    <>
      <Seo
        title="Pricing — IDEAL from $999 per site per year"
        description="Annual per-site pricing for IDEAL clinical monitoring. Starter covers one site and five clients. Professional and Enterprise scale with your organisation."
        path="/pricing"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'IDEAL clinical monitoring platform',
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'AUD',
            lowPrice: '999',
            highPrice: '2499',
            offerCount: 3,
          },
        }}
      />

      <section className="relative overflow-hidden border-b border-border">
        <div className="glow-bg pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden />
        <div className="site-container relative py-16 text-center sm:py-24">
          <span className="eyebrow">Pricing</span>
          <h1 className="display-1 mx-auto mt-6 max-w-2xl">Annual pricing, per site</h1>
          <p className="lead mx-auto mt-6 max-w-2xl">
            No per-seat charges. Invite every worker, team leader and clinician who needs access.
            All prices in AUD and include GST.
          </p>
        </div>
      </section>

      <section className="site-container -mt-6 pb-16 pt-12 sm:pb-20">
        <PricingTable />
      </section>

      <section className="border-y border-border bg-card">
        <div className="site-container site-section">
          <h2 className="display-2">Compare plans</h2>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Feature</TableHead>
                  <TableHead>Starter</TableHead>
                  <TableHead>Professional</TableHead>
                  <TableHead>Enterprise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    <TableCell><Cell value={row.starter} /></TableCell>
                    <TableCell><Cell value={row.professional} /></TableCell>
                    <TableCell><Cell value={row.enterprise} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container max-w-3xl">
          <h2 className="display-2 text-center">Billing questions</h2>
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
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to="/signup">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Ask a question</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
