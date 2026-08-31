/**
 * Tracks which modules have been acknowledged as set up, per client.
 * A module enabled for the first time starts with NO configuration —
 * it must be set up manually in that module's Settings tab.
 */

import { useCallback, useState } from 'react';
import { useActiveClient } from '@/contexts/ActiveClientContext';

const storageKey = (clientId: string | null) =>
  `ideal.moduleSetupDone.${clientId ?? 'unknown'}`;

function read(clientId: string | null): string[] {
  try {
    const raw = localStorage.getItem(storageKey(clientId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useModuleSetupStatus() {
  const { activeClientId } = useActiveClient();
  const [setupDone, setSetupDone] = useState<string[]>(() => read(activeClientId));

  const isSetupComplete = useCallback(
    (moduleId: string) => setupDone.includes(moduleId),
    [setupDone]
  );

  const markSetupComplete = useCallback(
    (moduleId: string) => {
      setSetupDone((prev) => {
        if (prev.includes(moduleId)) return prev;
        const next = [...prev, moduleId];
        try {
          localStorage.setItem(storageKey(activeClientId), JSON.stringify(next));
        } catch {
          /* ignore storage errors */
        }
        return next;
      });
    },
    [activeClientId]
  );

  return { isSetupComplete, markSetupComplete };
}
