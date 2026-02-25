/**
 * Known Seizures Summary - Displays configured seizure patterns and triggers at top of dashboard
 */

import { useEpilepsyConfig } from '@/hooks/useEpilepsy';
import { SEIZURE_TYPES } from '@/types/epilepsy';
import { Brain, Zap } from 'lucide-react';

interface KnownSeizuresSummaryProps {
  clientId?: string;
}

// Build a flat lookup: value → label
const seizureTypeLabels: Record<string, string> = {};
Object.values(SEIZURE_TYPES).forEach(category => {
  category.types.forEach(t => {
    seizureTypeLabels[t.value] = t.label;
  });
});

export function KnownSeizuresSummary({ clientId }: KnownSeizuresSummaryProps) {
  const { config, isLoading } = useEpilepsyConfig(clientId);

  const knownTypes: string[] = config?.known_seizure_types ?? [];
  const knownDurations: Record<string, string> = config?.known_seizure_durations ?? {};
  const knownClusterSeizures: boolean = config?.known_cluster_seizures ?? false;
  const knownTriggers: string[] = config?.known_seizure_triggers ?? [];

  const hasSeizureInfo = knownTypes.length > 0 || knownClusterSeizures;
  const hasTriggers = knownTriggers.length > 0;

  if (isLoading || (!hasSeizureInfo && !hasTriggers)) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Seizure Types */}
      {hasSeizureInfo && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                Known seizure history
              </h3>
              <ul className="space-y-1">
                {knownTypes.map(type => {
                  const label = seizureTypeLabels[type] || type;
                  const duration = knownDurations[type];
                  return (
                    <li key={type} className="flex items-baseline gap-2 text-sm text-muted-foreground">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0 mt-1.5" />
                      <span>
                        <span className="font-medium text-foreground">{label}</span>
                        {duration && (
                          <span className="ml-1 text-muted-foreground">— typically {duration}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
                {knownClusterSeizures && (
                  <li className="flex items-baseline gap-2 text-sm text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning flex-shrink-0 mt-1.5" />
                    <span>
                      <span className="font-medium text-foreground">Cluster Seizures</span>
                      <span className="ml-1 text-muted-foreground">— multiple seizures close together in time</span>
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Known Triggers */}
      {hasTriggers && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-warning/10 flex-shrink-0">
              <Zap className="h-5 w-5 text-warning" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                Potential seizure triggers
              </h3>
              <ul className="space-y-1">
                {knownTriggers.map(trigger => (
                  <li key={trigger} className="flex items-baseline gap-2 text-sm text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning/60 flex-shrink-0 mt-1.5" />
                    <span className="font-medium text-foreground">{trigger}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
