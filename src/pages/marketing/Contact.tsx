/**
 * Contact page - enquiry form (client-side only in this phase).
 */

import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Seo } from '@/components/marketing/Seo';

export default function Contact() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    // Phase 1: acknowledge locally. Delivery is wired up with the backend phase.
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Thanks — we’ll be in touch within one business day.');
      (e.target as HTMLFormElement).reset();
    }, 500);
  };

  return (
    <>
      <Seo
        title="Contact IDEAL — talk to our team"
        description="Ask about pricing, onboarding or clinical governance. Book a walkthrough of the IDEAL monitoring platform with our team."
        path="/contact"
      />

      <section className="relative overflow-hidden border-b border-border">
        <div className="glow-bg pointer-events-none absolute inset-x-0 top-0 h-72" aria-hidden />
        <div className="site-container relative py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="eyebrow">Contact</span>
            <h1 className="display-1 mt-6">Let’s talk about your service</h1>
            <p className="lead mt-5">
              Tell us how many sites and clients you support, and we’ll show you exactly how IDEAL
              would fit.
            </p>
          </div>
        </div>
      </section>

      <section className="site-container site-section grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organisation">Organisation</Label>
              <Input id="organisation" name="organisation" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sites">Number of sites</Label>
              <Select name="sites" defaultValue="1">
                <SelectTrigger id="sites">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 site</SelectItem>
                  <SelectItem value="2-3">2–3 sites</SelectItem>
                  <SelectItem value="4-10">4–10 sites</SelectItem>
                  <SelectItem value="10+">More than 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Label htmlFor="message">How can we help?</Label>
            <Textarea id="message" name="message" rows={5} required />
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send enquiry'}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            We use your details only to respond to this enquiry.
          </p>
        </form>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-sm font-semibold">Direct contact</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                <a href="mailto:info@idealat.com.au" className="hover:underline">
                  info@idealat.com.au
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                <span className="text-muted-foreground">Mon–Fri, 9am–5pm AEST</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                <span className="text-muted-foreground">Sydney, Australia</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-sm font-semibold text-destructive">Clinical emergencies</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              IDEAL is not an emergency service. In an emergency, call Triple Zero (000)
              immediately.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
