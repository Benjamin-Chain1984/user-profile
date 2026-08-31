import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const STORAGE_KEY = 'ideal_active_client_id';
const NAME_STORAGE_KEY = 'ideal_active_client_name';

interface ActiveClientContextType {
  activeClientId: string | null;
  activeClientName: string | null;
  setActiveClient: (clientId: string | null, clientName?: string | null) => void;
}

const ActiveClientContext = createContext<ActiveClientContextType | undefined>(undefined);

export function ActiveClientProvider({ children }: { children: ReactNode }) {
  const [activeClientId, setActiveClientId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [activeClientName, setActiveClientName] = useState<string | null>(
    () => localStorage.getItem(NAME_STORAGE_KEY)
  );

  const setActiveClient = useCallback((clientId: string | null, clientName?: string | null) => {
    setActiveClientId(clientId);
    setActiveClientName(clientName ?? null);
    if (clientId) {
      localStorage.setItem(STORAGE_KEY, clientId);
      if (clientName) localStorage.setItem(NAME_STORAGE_KEY, clientName);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(NAME_STORAGE_KEY);
    }
  }, []);

  return (
    <ActiveClientContext.Provider value={{ activeClientId, activeClientName, setActiveClient }}>
      {children}
    </ActiveClientContext.Provider>
  );
}

export function useActiveClient() {
  const ctx = useContext(ActiveClientContext);
  // Lenient fallback so public routes (QR poster etc.) render outside the provider
  if (!ctx) {
    return { activeClientId: null, activeClientName: null, setActiveClient: () => {} };
  }
  return ctx;
}

/**
 * Resolves an optional clientId argument to the globally active client.
 * Module hooks call this so every query/mutation is scoped to the
 * client selected in Admin > Clients without changing call sites.
 */
export function useClientIdOrActive(clientId?: string | null): string | undefined {
  const { activeClientId } = useActiveClient();
  return clientId ?? activeClientId ?? undefined;
}
