/**
 * ObservationContextSelector - Select context for vital sign observations
 */

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const OBSERVATION_CONTEXTS = [
  { id: 'routine', label: 'Routine Check', description: 'Scheduled monitoring' },
  { id: 'concern', label: 'Concern Raised', description: 'Responding to a concern' },
  { id: 'post_incident', label: 'Post-Incident', description: 'After an event or fall' },
  { id: 'recheck', label: 'Recheck', description: 'Follow-up on previous reading' },
  { id: 'other', label: 'Other', description: 'Other reason for check' },
] as const;

export type ObservationContext = typeof OBSERVATION_CONTEXTS[number]['id'];

interface ObservationContextSelectorProps {
  value: ObservationContext | null;
  onChange: (value: ObservationContext) => void;
  disabled?: boolean;
}

export function ObservationContextSelector({
  value,
  onChange,
  disabled = false,
}: ObservationContextSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Observation Context</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {OBSERVATION_CONTEXTS.map((ctx) => (
          <button
            key={ctx.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(ctx.id)}
            className={cn(
              'p-3 rounded-lg border text-left transition-all',
              value === ctx.id
                ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-muted/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <p className="font-medium text-sm">{ctx.label}</p>
            <p className="text-xs text-muted-foreground">{ctx.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
