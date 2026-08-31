import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Bell, MoreHorizontal, Plus, Pencil, Trash2, Mail } from 'lucide-react';
import {
  useNotificationContacts,
  useCreateNotificationContact,
  useUpdateNotificationContact,
  useDeleteNotificationContact,
} from '@/hooks/useNotificationContacts';
import { NotificationContactDialog } from './NotificationContactDialog';
import type { NotificationContact } from '@/types/notificationContacts';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

interface NotificationContactsSectionProps {
  clientId?: string;
}

export function NotificationContactsSection({ clientId }: NotificationContactsSectionProps) {
  clientId = useClientIdOrActive(clientId);
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const { data: contacts, isLoading } = useNotificationContacts(clientId);
  const createContact = useCreateNotificationContact();
  const updateContact = useUpdateNotificationContact();
  const deleteContact = useDeleteNotificationContact();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<NotificationContact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<NotificationContact | null>(null);

  const handleAddClick = () => {
    setEditingContact(null);
    setDialogOpen(true);
  };

  const handleEditClick = (contact: NotificationContact) => {
    setEditingContact(contact);
    setDialogOpen(true);
  };

  const handleDeleteClick = (contact: NotificationContact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleSave = (values: {
    full_name: string;
    relationship: string;
    email: string;
    is_active: boolean;
    notes?: string;
    preferred_contact_hours?: string;
    edit_reason?: string;
  }) => {
    if (editingContact) {
      updateContact.mutate(
        {
          id: editingContact.id,
          updates: {
            full_name: values.full_name,
            relationship: values.relationship,
            email: values.email,
            is_active: values.is_active,
            notes: values.notes || null,
            preferred_contact_hours: values.preferred_contact_hours || null,
            edit_reason: values.edit_reason || null,
          },
        },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createContact.mutate(
        {
          client_id: clientId || null,
          full_name: values.full_name,
          relationship: values.relationship,
          email: values.email,
          is_active: values.is_active,
          notes: values.notes || null,
          preferred_contact_hours: values.preferred_contact_hours || null,
          created_by: null,
        },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      deleteContact.mutate(contactToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setContactToDelete(null);
        },
      });
    }
  };

  return (
    <RestrictedSection requiredRole="admin" message="Admin access required to manage notification contacts">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Notification Contacts</CardTitle>
              <CardDescription>
                People who can receive email alerts from any module
              </CardDescription>
            </div>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading contacts...</div>
          ) : !contacts || contacts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No notification contacts yet.</p>
              <p className="text-sm">Add contacts who should receive email alerts.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className={!contact.is_active ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{contact.full_name}</TableCell>
                    <TableCell>{contact.relationship}</TableCell>
                    <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                    <TableCell>
                      {contact.is_active ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(contact)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(contact)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NotificationContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editingContact}
        onSave={handleSave}
        isLoading={createContact.isPending || updateContact.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {contactToDelete?.full_name}? They will no longer
              receive any notifications from any module.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RestrictedSection>
  );
}
