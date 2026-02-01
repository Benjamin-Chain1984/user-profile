// Notification Contacts types for centralized alert recipients

export type RelationshipType =
  | 'parent'
  | 'family_member'
  | 'guardian'
  | 'support_coordinator'
  | 'nurse'
  | 'dietitian'
  | 'speech_pathologist'
  | 'occupational_therapist'
  | 'gp'
  | 'manager'
  | 'other';

export const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'family_member', label: 'Family Member' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'support_coordinator', label: 'Support Coordinator' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'dietitian', label: 'Dietitian' },
  { value: 'speech_pathologist', label: 'Speech Pathologist' },
  { value: 'occupational_therapist', label: 'Occupational Therapist' },
  { value: 'gp', label: 'GP' },
  { value: 'manager', label: 'Manager' },
  { value: 'other', label: 'Other' },
];

export interface NotificationContact {
  id: string;
  client_id: string | null;
  full_name: string;
  relationship: string;
  email: string;
  is_active: boolean;
  notes: string | null;
  preferred_contact_hours: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export type AlertSeverity = 'amber' | 'red';

export interface ModuleAlertRecipient {
  id: string;
  client_id: string | null;
  module_name: string;
  alert_severity: AlertSeverity;
  notification_contact_id: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface NotificationEvent {
  id: string;
  client_id: string | null;
  module_name: string;
  alert_id: string | null;
  alert_severity: AlertSeverity | null;
  notification_contact_id: string | null;
  contact_email: string;
  contact_name: string;
  delivery_method: 'email';
  delivery_status: 'sent' | 'failed';
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  sent_at: string;
}

// Helper type for dropdown display
export interface NotificationContactOption {
  id: string;
  label: string; // "Jane Smith — Mother (jane@example.com)"
  name: string;
  relationship: string;
  email: string;
}

export function formatContactOption(contact: NotificationContact): NotificationContactOption {
  return {
    id: contact.id,
    label: `${contact.full_name} — ${contact.relationship} (${contact.email})`,
    name: contact.full_name,
    relationship: contact.relationship,
    email: contact.email,
  };
}
