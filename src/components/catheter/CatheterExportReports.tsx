/**
 * Catheter Export Reports - Placeholder
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CatheterExportReportsProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CatheterExportReports({ clientId, open, onOpenChange }: CatheterExportReportsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Catheter Reports</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground py-4">
          Export functionality coming soon. You will be able to generate PDF and CSV reports for catheter changes, flushes, stoma checks, and consumables usage.
        </p>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
