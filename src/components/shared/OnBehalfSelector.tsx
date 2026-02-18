/**
 * OnBehalfSelector - Reusable component for "Logged on behalf of" functionality
 * Replaces all free-text name fields with a verified team member dropdown.
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { cn } from '@/lib/utils';

const ON_BEHALF_REASONS = [
  { value: 'shift_handover', label: 'Shift Handover' },
  { value: 'staff_unavailable', label: 'Staff Member Unavailable' },
  { value: 'technical_issue', label: 'Technical Issue (Login)' },
  { value: 'verbal_report', label: 'Verbal Report from Staff' },
  { value: 'retrospective', label: 'Retrospective Entry' },
  { value: 'other', label: 'Other' },
] as const;

export interface OnBehalfData {
  onBehalfUserId: string | null;
  onBehalfName: string | null;
  onBehalfRole: string | null;
  onBehalfReason: string | null;
}

interface OnBehalfSelectorProps {
  value: OnBehalfData;
  onChange: (data: OnBehalfData) => void;
  disabled?: boolean;
}

export function OnBehalfSelector({ value, onChange, disabled }: OnBehalfSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { members, isLoading } = useTeamMembers();

  const handleMemberChange = (userId: string) => {
    const member = members.find(m => m.id === userId);
    if (member) {
      onChange({
        ...value,
        onBehalfUserId: member.id,
        onBehalfName: member.full_name,
        onBehalfRole: member.role,
      });
    }
  };

  const handleReasonChange = (reason: string) => {
    onChange({ ...value, onBehalfReason: reason });
  };

  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Clear on-behalf data when closing
      onChange({
        onBehalfUserId: null,
        onBehalfName: null,
        onBehalfRole: null,
        onBehalfReason: null,
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center justify-between w-full p-3 rounded-lg border text-left transition-colors",
            isOpen
              ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
              : "bg-muted/30 border-muted hover:bg-muted/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Logged on behalf of another staff member</span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/10 space-y-4">
        <p className="text-xs text-muted-foreground">
          Select the team member who performed this task. Both your identity and theirs will be recorded in the audit trail.
        </p>

        {/* Team Member Dropdown */}
        <div className="space-y-2">
          <Label>
            Staff Member <span className="text-destructive">*</span>
          </Label>
          <Select
            value={value.onBehalfUserId || ''}
            onValueChange={handleMemberChange}
            disabled={disabled || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? 'Loading team...' : 'Select team member'} />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name}
                  {member.role && ` — ${member.role}`}
                </SelectItem>
              ))}
              {members.length === 0 && !isLoading && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No other team members found
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <Label>
            Reason <span className="text-destructive">*</span>
          </Label>
          <Select
            value={value.onBehalfReason || ''}
            onValueChange={handleReasonChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reason..." />
            </SelectTrigger>
            <SelectContent>
              {ON_BEHALF_REASONS.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Helper to check if on-behalf data is active and valid */
export function isOnBehalfValid(data: OnBehalfData): boolean {
  if (!data.onBehalfUserId && !data.onBehalfName) return true; // Not active = valid
  return !!data.onBehalfUserId && !!data.onBehalfReason;
}

/** Helper to check if on-behalf is actively being used */
export function isOnBehalfActive(data: OnBehalfData): boolean {
  return !!data.onBehalfUserId;
}
