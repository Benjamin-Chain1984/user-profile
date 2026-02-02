import React from 'react';
import { useActiveNotificationContacts } from '@/hooks/useNotificationContacts';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatContactOption, type AlertSeverity } from '@/types/notificationContacts';
import { cn } from '@/lib/utils';

interface AlertRecipientSelectorProps {
  moduleName: string;
  severity: AlertSeverity;
  selectedContactIds: string[];
  onSelectionChange: (contactIds: string[]) => void;
  clientId?: string;
  className?: string;
}

export function AlertRecipientSelector({
  moduleName,
  severity,
  selectedContactIds,
  onSelectionChange,
  clientId,
  className,
}: AlertRecipientSelectorProps) {
  const { data: contacts, isLoading } = useActiveNotificationContacts(clientId);

  const setChecked = (contactId: string, nextChecked: boolean) => {
    const isSelected = selectedContactIds.includes(contactId);
    // No-op if nothing changes (prevents accidental update loops)
    if (nextChecked === isSelected) return;

    if (nextChecked) {
      onSelectionChange([...selectedContactIds, contactId]);
    } else {
      onSelectionChange(selectedContactIds.filter((id) => id !== contactId));
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground p-3 bg-muted rounded-md', className)}>
        No notification contacts configured. Add contacts in the Profile section to enable alert
        notifications.
      </div>
    );
  }

  const severityLabel = severity === 'amber' ? 'Amber' : 'Red';
  const severityColor = severity === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {severityLabel} Alert Recipients
        </Label>
        <Badge variant="outline" className={cn('text-xs', severityColor)}>
          {severity.toUpperCase()}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Select who should receive email notifications when {severityLabel.toLowerCase()} alerts occur for this module.
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
        {contacts.map((contact) => {
          const option = formatContactOption(contact);
          const isSelected = selectedContactIds.includes(contact.id);

          return (
            <div
              key={contact.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors',
                isSelected && 'bg-muted'
              )}
              onClick={() => setChecked(contact.id, !isSelected)}
            >
              <Checkbox
                id={`${moduleName}-${severity}-${contact.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => {
                  // Radix can emit "indeterminate"; treat it as unchecked.
                  const nextChecked = checked === true;
                  setChecked(contact.id, nextChecked);
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor={`${moduleName}-${severity}-${contact.id}`}
                className="flex-1 text-sm cursor-pointer"
              >
                <span className="font-medium">{option.name}</span>
                <span className="text-muted-foreground"> — {option.relationship}</span>
                <span className="text-xs text-muted-foreground block">{option.email}</span>
              </label>
            </div>
          );
        })}
      </div>
      {selectedContactIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
