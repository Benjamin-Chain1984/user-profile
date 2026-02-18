/**
 * Escalate Swallowing Concerns Dialog
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Phone, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EscalateSwallowingDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Escalate Swallowing Concerns
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-semibold text-destructive">
                If you observe ANY of the following, ACT IMMEDIATELY:
              </p>
              <ul className="space-y-1 text-sm text-destructive">
                <li>• Choking or gagging</li>
                <li>• Repeated coughing during meals</li>
                <li>• Wet or gurgly voice after swallowing</li>
                <li>• Food or fluid coming out of the nose</li>
                <li>• Difficulty breathing during or after eating</li>
                <li>• Colour changes (blue lips/face)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-semibold">Immediate Actions:</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  <strong>Stop the meal immediately</strong>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  Keep the person upright
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">3.</span>
                  If choking — follow choking protocol
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">4.</span>
                  Call 000 if the person is in distress
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">5.</span>
                  Notify Team Leader and document the event
                </li>
              </ol>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="destructive" size="lg" className="w-full" asChild>
              <a href="tel:000">
                <Phone className="h-4 w-4 mr-2" />
                Call 000
              </a>
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
              <FileText className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
