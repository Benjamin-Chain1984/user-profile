/**
 * Confirmation dialog for undo action.
 * Shows entry details and requires explicit confirmation.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import type { UndoableEntry } from '@/hooks/useUndoStack';
import { getModuleLabel, summariseEntry } from '@/hooks/useUndoStack';

interface UndoConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: UndoableEntry | null;
  onConfirm: () => void;
  isUndoing: boolean;
  /** Whether this entry was linked to a red/critical alert */
  isCritical?: boolean;
  staffName?: string;
}

export function UndoConfirmDialog({
  open,
  onOpenChange,
  entry,
  onConfirm,
  isUndoing,
  isCritical = false,
  staffName,
}: UndoConfirmDialogProps) {
  if (!entry) return null;

  const moduleLabel = getModuleLabel(entry.table_name);
  const summary = summariseEntry(entry.table_name, entry.entry_snapshot);
  const entryTime = entry.created_at
    ? format(new Date(entry.created_at), "dd/MM/yyyy HH:mm")
    : 'Unknown';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg">
            <Undo2 className="h-5 w-5 text-muted-foreground" />
            Confirm Undo
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-4">
            <p>
              You are about to undo the most recent entry. This will remove it
              from records and may change alerts, trends, and status indicators.
            </p>
            <p className="font-medium">Are you sure you want to proceed?</p>

            {/* Entry details card */}
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Module:</span>
                <Badge variant="secondary" className="text-xs">
                  {moduleLabel}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Entry: </span>
                <span className="font-medium text-foreground">{summary}</span>
              </div>
              {staffName && (
                <div>
                  <span className="text-muted-foreground">Logged by: </span>
                  <span className="text-foreground">{staffName}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Time: </span>
                <span className="text-foreground">{entryTime}</span>
              </div>
            </div>

            {/* Critical warning */}
            {isCritical && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <span className="text-destructive">
                  This entry affected urgent safety alerts. Undoing it may
                  change the current alert status.
                </span>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUndoing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isUndoing}
            className="bg-muted text-foreground hover:bg-muted/80 border"
          >
            {isUndoing ? 'Undoing…' : 'Undo Entry'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
