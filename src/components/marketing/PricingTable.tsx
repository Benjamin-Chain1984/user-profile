/**
 * PricingTable - shared plan cards used on the pricing page and landing preview.
 */

import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { plans } from '@/data/marketing';

export function PricingTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 ${
            plan.highlight
              ? 'border-primary/40 bg-card shadow-elegant'
              : 'border-border bg-card shadow-card'
          }`}
        >
          {plan.highlight && (
            <span className="absolute -top-3 left-6 rounded-full gradient-surface px-3 py-1 text-xs font-semibold text-primary-foreground">
              Most popular
            </span>
          )}
          <h3 className="display-3">{plan.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>
          <div className="mt-6 flex items-end gap-2">
            <span className="font-display text-4xl font-extrabold tracking-tight">{plan.price}</span>
            <span className="pb-1 text-sm text-muted-foreground">{plan.cadence}</span>
          </div>
          <Button
            asChild
            className="mt-6 w-full"
            variant={plan.highlight ? 'default' : 'outline'}
          >
            <Link to={plan.id === 'enterprise' ? '/contact' : `/signup?plan=${plan.id}`}>
              {plan.cta}
            </Link>
          </Button>
          <ul className={`mt-6 space-y-3 ${compact ? '' : 'flex-1'}`}>
            {(compact ? plan.features.slice(0, 5) : plan.features).map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
