/**
 * Global Undo Button – placed on the Home Page next to Pause Monitoring.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Undo2 } from 'lucide-react';
import { useUndoStack } from '@/hooks/useUndoStack';
import { UndoConfirmDialog } from './UndoConfirmDialog';
import { supabase } from '@/integrations/supabase/client';

export function UndoButton() {
  const { nextUndoEntry, canUndo, performUndo, isUndoing } = useUndoStack();
  const [showConfirm, setShowConfirm] = useState(false);
  const [staffName, setStaffName] = useState<string | undefined>();

  // Resolve staff name for the next entry
  useEffect(() => {
    if (!nextUndoEntry?.created_by) {
      setStaffName(undefined);
      return;
    }
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', nextUndoEntry.created_by)
      .maybeSingle()
      .then(({ data }) => {
        setStaffName(data?.full_name || 'Unknown');
      });
  }, [nextUndoEntry?.created_by]);

  const handleUndo = async () => {
    if (!nextUndoEntry) return;
    await performUndo(nextUndoEntry);
    setShowConfirm(false);
  };

  // Check if entry might be critical (snapshot has severity = red or action)
  const isCritical = nextUndoEntry?.entry_snapshot
    ? ['red', 'action', 'severe'].includes(
        String(nextUndoEntry.entry_snapshot.severity || '').toLowerCase()
      )
    : false;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(true)}
              disabled={!canUndo || isUndoing}
              className="gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Undo Last Entry
            </Button>
          </span>
        </TooltipTrigger>
        {!canUndo && (
          <TooltipContent>No recent entries to undo.</TooltipContent>
        )}
      </Tooltip>

      <UndoConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        entry={nextUndoEntry}
        onConfirm={handleUndo}
        isUndoing={isUndoing}
        isCritical={isCritical}
        staffName={staffName}
      />
    </>
  );
}
