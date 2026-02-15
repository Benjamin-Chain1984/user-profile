/**
 * VaccinationSection - Vaccination cards section
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
import { useHealthPrevention } from '@/hooks/useHealthPrevention';
import { 
  VaccinationProgram, 
  VaccinationRecord,
  VaccinationType,
} from '@/types/healthPrevention';
import { 
  Syringe, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  HelpCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface VaccinationWithStatus {
  program: VaccinationProgram;
  latestRecord: VaccinationRecord | undefined;
  displayStatus: 'completed' | 'due' | 'overdue' | 'not_recorded';
  isAgeEligible: boolean;
}

interface VaccinationSectionProps {
  vaccinations: VaccinationWithStatus[];
  age: number | null;
}

export function VaccinationSection({ vaccinations, age }: VaccinationSectionProps) {
  const { logVaccination } = useHealthPrevention();
  const [selectedVaccination, setSelectedVaccination] = useState<VaccinationWithStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [dateGiven, setDateGiven] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [givenBy, setGivenBy] = useState('');
  const [vaccineBrand, setVaccineBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusBadge = (status: VaccinationWithStatus['displayStatus']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="h-3 w-3" /> Up to date</Badge>;
      case 'due':
        return <Badge className="bg-warning text-warning-foreground gap-1"><Clock className="h-3 w-3" /> Due</Badge>;
      case 'overdue':
        return <Badge className="bg-warning text-warning-foreground gap-1"><AlertTriangle className="h-3 w-3" /> Overdue</Badge>;
      case 'not_recorded':
        return <Badge variant="outline" className="gap-1"><HelpCircle className="h-3 w-3" /> Not recorded</Badge>;
    }
  };

  const handleLogClick = (vaccination: VaccinationWithStatus) => {
    setSelectedVaccination(vaccination);
    setIsDialogOpen(true);
    setDateGiven(format(new Date(), 'yyyy-MM-dd'));
    setGivenBy('');
    setVaccineBrand('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedVaccination) return;
    setIsSubmitting(true);
    await logVaccination(selectedVaccination.program.id, {
      dateGiven,
      givenBy: givenBy || undefined,
      vaccineBrand: vaccineBrand || undefined,
      notes: notes || undefined,
    });
    setIsSubmitting(false);
    setIsDialogOpen(false);
    setSelectedVaccination(null);
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Syringe className="h-5 w-5" />
          Vaccinations
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {vaccinations.map((vaccination) => (
            <Card key={vaccination.program.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{vaccination.program.name}</span>
                  {getStatusBadge(vaccination.displayStatus)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {vaccination.program.description}
                </p>

                <p className="text-sm">
                  <span className="text-muted-foreground">Frequency: </span>
                  {vaccination.program.frequencyText}
                </p>

                {/* Age eligibility note */}
                {vaccination.program.minAge && !vaccination.isAgeEligible && (
                  <p className="text-sm text-muted-foreground">
                    Recommended for ages {vaccination.program.minAge}+
                  </p>
                )}

                {/* Last given */}
                {vaccination.latestRecord?.dateGiven && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Last given: </span>
                    {format(new Date(vaccination.latestRecord.dateGiven), 'dd MMM yyyy')}
                    {vaccination.latestRecord.givenBy && (
                      <span className="text-muted-foreground"> at {vaccination.latestRecord.givenBy}</span>
                    )}
                  </p>
                )}

                {/* Next due */}
                {vaccination.latestRecord?.nextDueDate && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Next due: </span>
                    {format(new Date(vaccination.latestRecord.nextDueDate), 'dd MMM yyyy')}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleLogClick(vaccination)}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Log vaccination
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Log Vaccination Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Vaccination</DialogTitle>
            <DialogDescription>
              Record {selectedVaccination?.program.name} vaccination
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dateGiven">Date given *</Label>
              <Input
                id="dateGiven"
                type="date"
                value={dateGiven}
                onChange={(e) => setDateGiven(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <Label htmlFor="givenBy">Given by (optional)</Label>
              <Input
                id="givenBy"
                placeholder="e.g., GP, Pharmacy, Clinic"
                value={givenBy}
                onChange={(e) => setGivenBy(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vaccineBrand">Vaccine brand (optional)</Label>
              <Input
                id="vaccineBrand"
                placeholder="e.g., Fluad Quad, Comirnaty"
                value={vaccineBrand}
                onChange={(e) => setVaccineBrand(e.target.value)}
              />
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
