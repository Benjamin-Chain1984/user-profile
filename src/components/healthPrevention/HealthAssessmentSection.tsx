/**
 * HealthAssessmentSection - Annual Comprehensive Health Assessment section
 * Medicare-supported annual health assessment for people with intellectual disability
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Stethoscope,
  Info,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

export interface HealthAssessmentRecord {
  id: string;
  clientId: string | null;
  dateCompleted: string;
  completedBy: string | null;
  location: string | null;
  notes: string | null;
  nextDueDate: string | null;
  createdAt: string;
  createdBy: string | null;
}

export type HealthAssessmentDisplayStatus = 'up_to_date' | 'due' | 'overdue' | 'not_recorded';

interface HealthAssessmentSectionProps {
  latestRecord: HealthAssessmentRecord | null;
  displayStatus: HealthAssessmentDisplayStatus;
  gpReminderText: string;
  onLogAssessment: (data: {
    dateCompleted: string;
    completedBy?: string;
    location?: string;
    notes?: string;
  }) => Promise<void>;
}

export function HealthAssessmentSection({
  latestRecord,
  displayStatus,
  gpReminderText,
  onLogAssessment,
}: HealthAssessmentSectionProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [dateCompleted, setDateCompleted] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [completedBy, setCompletedBy] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusBadge = () => {
    switch (displayStatus) {
      case 'up_to_date':
        return <Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="h-3 w-3" /> Up to date</Badge>;
      case 'due':
        return <Badge className="bg-warning text-warning-foreground gap-1"><Clock className="h-3 w-3" /> Due</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive text-destructive-foreground gap-1"><AlertTriangle className="h-3 w-3" /> Overdue</Badge>;
      case 'not_recorded':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Not recorded</Badge>;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onLogAssessment({
      dateCompleted,
      completedBy: completedBy || undefined,
      location: location || undefined,
      notes: notes || undefined,
    });
    setIsSubmitting(false);
    setShowLogDialog(false);
    setDateCompleted(format(new Date(), 'yyyy-MM-dd'));
    setCompletedBy('');
    setLocation('');
    setNotes('');
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Annual Comprehensive Health Assessment
        </h3>



        {/* Status card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Health Assessment</span>
              {getStatusBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Recommended every 12 months. A thorough check-up with a GP to look at 
              overall health, identify any concerns early, and create a health plan.
            </p>

            {latestRecord?.dateCompleted && (
              <p className="text-sm">
                <span className="text-muted-foreground">Last completed: </span>
                {format(new Date(latestRecord.dateCompleted), 'dd MMM yyyy')}
              </p>
            )}

            {latestRecord?.completedBy && (
              <p className="text-sm">
                <span className="text-muted-foreground">Completed by: </span>
                {latestRecord.completedBy}
              </p>
            )}

            {latestRecord?.nextDueDate && (
              <p className="text-sm">
                <span className="text-muted-foreground">Next due: </span>
                {format(new Date(latestRecord.nextDueDate), 'dd MMM yyyy')}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => setShowLogDialog(true)}
              >
                <CheckCircle2 className="h-3 w-3" />
                Log completed
              </Button>
            </div>

            {(displayStatus === 'due' || displayStatus === 'overdue' || displayStatus === 'not_recorded') && (
              <p className="text-sm text-primary flex items-center gap-1 pt-1">
                <Stethoscope className="h-3 w-3" />
                {gpReminderText}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Information card */}
        <Card className="bg-muted/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  People with an intellectual disability can get a free yearly health check-up 
                  through Medicare. This helps their GP spot any health issues early and make a plan 
                  to stay well.
                </p>
                <a
                  href="https://www.health.gov.au/topics/disability/health-care-for-people-with-disability"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  Learn more at health.gov.au
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Health Assessment</DialogTitle>
            <DialogDescription>
              Record completion of the Annual Comprehensive Health Assessment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="assessmentDate">Date completed *</Label>
              <Input
                id="assessmentDate"
                type="date"
                value={dateCompleted}
                onChange={(e) => setDateCompleted(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <Label htmlFor="assessmentCompletedBy">Completed by (optional)</Label>
              <Input
                id="assessmentCompletedBy"
                placeholder="e.g., Dr Smith, Main Street Medical"
                value={completedBy}
                onChange={(e) => setCompletedBy(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="assessmentLocation">Location (optional)</Label>
              <Input
                id="assessmentLocation"
                placeholder="e.g., GP clinic name"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="assessmentNotes">Notes (optional)</Label>
              <Textarea
                id="assessmentNotes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !dateCompleted}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
