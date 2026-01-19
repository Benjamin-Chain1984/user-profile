/**
 * Client Audit Dialog
 * View audit events for a specific client
 */

import { useState, useEffect } from 'react';
import { auditService, type AuditEvent } from '@/services/audit';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface ClientRow {
  id: string;
  preferred_name: string;
}

interface ClientAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientRow | null;
}

const actionColors: Record<string, string> = {
  CLIENT_ACCESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  QR_ROTATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  LOGIN_SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  LOGIN_FAIL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  OTP_SENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  OTP_VERIFY_FAIL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function ClientAuditDialog({
  open,
  onOpenChange,
  client,
}: ClientAuditDialogProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && client) {
      setIsLoading(true);
      auditService
        .getClientEvents(client.id)
        .then(setEvents)
        .finally(() => setIsLoading(false));
    }
  }, [open, client]);

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Audit Log: {client.preferred_name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit events found for this client.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      className={actionColors[event.action] || 'bg-muted text-muted-foreground'}
                    >
                      {event.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {event.metadata.route && (
                        <div>Route: {event.metadata.route}</div>
                      )}
                      {event.metadata.userAgent && (
                        <div className="truncate">
                          Device: {event.metadata.userAgent.split('(')[1]?.split(')')[0] || 'Unknown'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
