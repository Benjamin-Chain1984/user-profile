/**
 * ScreeningSection - Cancer screening cards section
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useHealthPrevention } from '@/hooks/useHealthPrevention';
import { 
  ScreeningProgram, 
  CancerScreeningRecord,
  ScreeningType,
  SmokingHistory,
} from '@/types/healthPrevention';
import { 
  FileSearch, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface ScreeningWithStatus {
  program: ScreeningProgram;
  isEligible: boolean;
  latestRecord: CancerScreeningRecord | undefined;
  displayStatus: 'up_to_date' | 'due' | 'overdue' | 'not_eligible' | 'deferred';
}

interface ScreeningSectionProps {
  screenings: ScreeningWithStatus[];
  age: number | null;
  sex: string | null | undefined;
  gpReminderText: string;
  lungSmokingHistory: SmokingHistory | null | undefined;
}

export function ScreeningSection({ 
  screenings, 
  age, 
  sex, 
  gpReminderText,
  lungSmokingHistory,
}: ScreeningSectionProps) {
  const { logScreeningCompletion, deferScreening } = useHealthPrevention();
  const [selectedScreening, setSelectedScreening] = useState<ScreeningWithStatus | null>(null);
  const [dialogMode, setDialogMode] = useState<'log' | 'defer' | null>(null);
  
  // Form state
  const [dateCompleted, setDateCompleted] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [location, setLocation] = useState('');
  const [outcomeKnown, setOutcomeKnown] = useState<'yes' | 'no'>('no');
  const [notes, setNotes] = useState('');
  const [deferReason, setDeferReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusBadge = (status: ScreeningWithStatus['displayStatus']) => {
    switch (status) {
      case 'up_to_date':
        return <Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="h-3 w-3" /> Up to date</Badge>;
      case 'due':
        return <Badge className="bg-warning text-warning-foreground gap-1"><Clock className="h-3 w-3" /> Due</Badge>;
      case 'overdue':
        return <Badge className="bg-warning text-warning-foreground gap-1"><AlertTriangle className="h-3 w-3" /> Overdue</Badge>;
      case 'not_eligible':
        return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Not eligible</Badge>;
      case 'deferred':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Deferred</Badge>;
    }
  };

  const handleLogClick = (screening: ScreeningWithStatus) => {
    setSelectedScreening(screening);
    setDialogMode('log');
    setDateCompleted(format(new Date(), 'yyyy-MM-dd'));
    setLocation('');
    setOutcomeKnown('no');
    setNotes('');
  };

  const handleDeferClick = (screening: ScreeningWithStatus) => {
    setSelectedScreening(screening);
    setDialogMode('defer');
    setDeferReason('');
  };

  const handleSubmitLog = async () => {
    if (!selectedScreening) return;
    setIsSubmitting(true);
    await logScreeningCompletion(selectedScreening.program.id, {
      dateCompleted,
      location: location || undefined,
      outcomeKnown: outcomeKnown === 'yes',
      notes: notes || undefined,
    });
    setIsSubmitting(false);
    setDialogMode(null);
    setSelectedScreening(null);
  };

  const handleSubmitDefer = async () => {
    if (!selectedScreening || !deferReason) return;
    setIsSubmitting(true);
    await deferScreening(selectedScreening.program.id, deferReason);
    setIsSubmitting(false);
    setDialogMode(null);
    setSelectedScreening(null);
  };

  // Filter screenings: show eligible ones, plus lung if advisory
  const visibleScreenings = screenings.filter(s => 
    s.isEligible || s.program.isAdvisoryOnly
  );

  if (visibleScreenings.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          Cancer Screening
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {visibleScreenings.map((screening) => (
            <Card key={screening.program.id} className="relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{screening.program.name}</span>
                  {getStatusBadge(screening.displayStatus)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {screening.program.description}
                </p>

                {/* Lung screening smoking advisory */}
                {screening.program.id === 'lung' && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium">Smoking History</p>
                        {lungSmokingHistory === 'yes' || lungSmokingHistory === 'unsure' ? (
                          <p className="text-muted-foreground">Discuss eligibility with GP</p>
                        ) : lungSmokingHistory === 'no' ? (
                          <p className="text-muted-foreground">Lower risk - discuss with GP if concerned</p>
                        ) : (
                          <p className="text-muted-foreground">Not recorded - set in Settings</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Eligibility status */}
                {!screening.isEligible && !screening.program.isAdvisoryOnly && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Eligibility: </span>
                    {screening.program.eligibleSex !== 'all' && (
                      <span>{screening.program.eligibleSex === 'female' ? 'Female, ' : 'Male, '}</span>
                    )}
                    <span>ages {screening.program.minAge}–{screening.program.maxAge}</span>
                  </p>
                )}

                {/* Last completed */}
                {screening.latestRecord?.dateCompleted && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Last completed: </span>
                    {format(new Date(screening.latestRecord.dateCompleted), 'dd MMM yyyy')}
                  </p>
                )}

                {/* Next due */}
                {screening.latestRecord?.nextDueDate && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Next due: </span>
                    {format(new Date(screening.latestRecord.nextDueDate), 'dd MMM yyyy')}
                  </p>
                )}

                {/* Actions */}
                {screening.isEligible && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleLogClick(screening)}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Log completed
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="gap-1"
                      onClick={() => handleDeferClick(screening)}
                    >
                      Deferred / Not appropriate
                    </Button>
                  </div>
                )}

                {/* GP reminder */}
                {(screening.displayStatus === 'due' || screening.displayStatus === 'overdue') && (
                  <p className="text-sm text-primary flex items-center gap-1 pt-1">
                    <Stethoscope className="h-3 w-3" />
                    {gpReminderText}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Log Completion Dialog */}
      <Dialog open={dialogMode === 'log'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Screening Completion</DialogTitle>
            <DialogDescription>
              Record completion of {selectedScreening?.program.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dateCompleted">Date completed *</Label>
              <Input
                id="dateCompleted"
                type="date"
                value={dateCompleted}
                onChange={(e) => setDateCompleted(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., BreastScreen NSW, GP clinic"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <Label>Outcome known?</Label>
              <RadioGroup value={outcomeKnown} onValueChange={(v) => setOutcomeKnown(v as 'yes' | 'no')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="outcome-yes" />
                  <Label htmlFor="outcome-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="outcome-no" />
                  <Label htmlFor="outcome-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitLog} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Defer Dialog */}
      <Dialog open={dialogMode === 'defer'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Defer Screening</DialogTitle>
            <DialogDescription>
              Record reason for deferring {selectedScreening?.program.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="deferReason">Reason for deferral *</Label>
              <Textarea
                id="deferReason"
                placeholder="e.g., Discussed with GP - not appropriate at this time due to..."
                value={deferReason}
                onChange={(e) => setDeferReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitDefer} disabled={isSubmitting || !deferReason}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
