/**
 * Rotate QR Dialog
 * Confirm and rotate client's QR token
 */

import { useState } from 'react';
import { clientTokenService } from '@/services/clientToken';
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
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface ClientRow {
  id: string;
  preferred_name: string;
}

interface RotateQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientRow | null;
  onComplete: (newToken: string) => void;
}

export function RotateQRDialog({
  open,
  onOpenChange,
  client,
  onComplete,
}: RotateQRDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRotate = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      const result = await clientTokenService.rotateClientToken(client.id);
      
      if (!result.success || !result.newToken) {
        throw new Error(result.error || 'Failed to rotate token');
      }

      toast.success('QR code rotated successfully. Old posters are now invalid.');
      onComplete(result.newToken);
    } catch (err) {
      console.error('Error rotating token:', err);
      toast.error('Failed to rotate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <AlertDialogTitle>Rotate QR Code</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to rotate the QR code for{' '}
              <strong>{client?.preferred_name}</strong>?
            </p>
            <p className="text-destructive">
              This will immediately invalidate all existing printed posters for this client.
              You will need to print and distribute new posters.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRotate} disabled={isLoading}>
            {isLoading ? 'Rotating...' : 'Rotate & Generate New Poster'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
