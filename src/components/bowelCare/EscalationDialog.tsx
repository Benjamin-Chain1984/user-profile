/**
 * Escalation Dialog - Record escalation contacts and advice
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEscalationRecords } from '@/hooks/useBowelCare';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface EscalationDialogProps {
  clientId: string;
  alertId?: string;
  reason: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CONTACT_ROLES = [
  { value: 'supervisor', label: 'Supervisor / Manager' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'gp', label: 'GP / Doctor' },
  { value: 'family', label: 'Family Member' },
  { value: 'on_call', label: 'On-Call Service' },
  { value: 'other', label: 'Other' },
];

export function EscalationDialog({
  clientId,
  alertId,
  reason,
  open,
  onOpenChange,
  onSuccess,
}: EscalationDialogProps) {
  const { recordEscalation, isRecording } = useEscalationRecords(clientId);

  const [contactPerson, setContactPerson] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [adviceReceived, setAdviceReceived] = useState('');

  const handleSubmit = () => {
    if (!contactPerson.trim()) return;

    recordEscalation(
      {
        alert_id: alertId,
        escalation_reason: reason,
        contacted_person: contactPerson.trim(),
        contact_role: contactRole || null,
        advice_received: adviceReceived.trim() || null,
      },
      {
        onSuccess: () => {
          setContactPerson('');
          setContactRole('');
          setAdviceReceived('');
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Record Escalation
          </DialogTitle>
          <DialogDescription>
            Document the escalation contact and any advice received
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason */}
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive">Escalation Reason</p>
            <p className="text-sm text-muted-foreground mt-1">{reason}</p>
          </div>

          {/* Contact Person */}
          <div className="space-y-2">
            <Label htmlFor="contact_person">Who was contacted? *</Label>
            <Input
              id="contact_person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g., Dr Smith, Jane (Mum)"
            />
          </div>

          {/* Contact Role */}
          <div className="space-y-2">
            <Label>Contact's Role</Label>
            <Select value={contactRole} onValueChange={setContactRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advice Received */}
          <div className="space-y-2">
            <Label htmlFor="advice">Advice Received</Label>
            <Textarea
              id="advice"
              value={adviceReceived}
              onChange={(e) => setAdviceReceived(e.target.value)}
              placeholder="What advice or instructions were given?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRecording}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!contactPerson.trim() || isRecording}>
            {isRecording && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Record Escalation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
