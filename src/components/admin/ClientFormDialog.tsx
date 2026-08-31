/**
 * Client Form Dialog
 * Add or edit client information
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clientTokenService } from '@/services/clientToken';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ClientRow {
  id: string;
  preferred_name: string;
  beacon_id: string | null;
  status: string;
}

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientRow | null;
  onSaved: () => void;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: ClientFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    preferred_name: '',
    beacon_id: '',
    status: 'active',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        preferred_name: client.preferred_name,
        beacon_id: client.beacon_id || '',
        status: client.status,
      });
    } else {
      setFormData({
        preferred_name: '',
        beacon_id: '',
        status: 'active',
      });
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.preferred_name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);

    try {
      if (client) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            preferred_name: formData.preferred_name.trim(),
            beacon_id: formData.beacon_id.trim() || null,
            status: formData.status,
          })
          .eq('id', client.id);

        if (error) throw error;
        toast.success('Client updated successfully');
      } else {
        // Create new client with token
        const token = clientTokenService.generateSecureToken();
        const tokenHash = await clientTokenService.hashToken(token);

        const { error } = await supabase.from('clients').insert({
          preferred_name: formData.preferred_name.trim(),
          beacon_id: formData.beacon_id.trim() || null,
          status: formData.status,
          poster_qr_token_hash: tokenHash,
          poster_qr_token_plain: token,
        } as any);

        if (error) throw error;
        toast.success('Client created successfully. Generate a poster to get the QR code.');
      }

      onSaved();
    } catch (err) {
      console.error('Error saving client:', err);
      toast.error('Failed to save client');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferred_name">Preferred Name *</Label>
            <Input
              id="preferred_name"
              value={formData.preferred_name}
              onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
              placeholder="Enter client's preferred name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beacon_id">Beacon ID (Serial Number)</Label>
            <Input
              id="beacon_id"
              value={formData.beacon_id}
              onChange={(e) => setFormData({ ...formData, beacon_id: e.target.value })}
              placeholder="e.g. BCN-000123"
            />
            <p className="text-xs text-muted-foreground">
              Unique serial number of the IoT beacon assigned to this client. Must be unique across clients.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : client ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
