 import { useState } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Input } from '@/components/ui/input';
 import { AlertTriangle, Pause } from 'lucide-react';
 import { PAUSE_REASONS, type PauseReason, type PauseEndType } from '@/types/monitoringStatus';
 import { format } from 'date-fns';
 
 interface PauseMonitoringDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: (data: {
     reason: PauseReason;
     notes?: string;
     pauseStartDatetime: string;
     pauseEndType: PauseEndType;
     pauseEndDatetime?: string;
   }) => Promise<boolean>;
 }
 
 export function PauseMonitoringDialog({
   open,
   onOpenChange,
   onConfirm,
 }: PauseMonitoringDialogProps) {
   const [reason, setReason] = useState<PauseReason>('hospital_admission');
   const [notes, setNotes] = useState('');
   const [pauseEndType, setPauseEndType] = useState<PauseEndType>('manual');
   const [pauseEndDatetime, setPauseEndDatetime] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const handleConfirm = async () => {
     setIsSubmitting(true);
     const success = await onConfirm({
       reason,
       notes: notes.trim() || undefined,
       pauseStartDatetime: new Date().toISOString(),
       pauseEndType,
       pauseEndDatetime: pauseEndType === 'scheduled' ? pauseEndDatetime : undefined,
     });
     setIsSubmitting(false);
     if (success) {
       onOpenChange(false);
       // Reset form
       setReason('hospital_admission');
       setNotes('');
       setPauseEndType('manual');
       setPauseEndDatetime('');
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Pause className="h-5 w-5 text-warning" />
             Pause Monitoring
           </DialogTitle>
           <DialogDescription>
             Temporarily suspend health monitoring, alerts, and notifications.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           {/* Reason */}
           <div className="space-y-2">
             <Label htmlFor="pause-reason">Reason for pause *</Label>
             <Select value={reason} onValueChange={(v) => setReason(v as PauseReason)}>
               <SelectTrigger id="pause-reason">
                 <SelectValue placeholder="Select reason" />
               </SelectTrigger>
               <SelectContent>
                 {PAUSE_REASONS.map((r) => (
                   <SelectItem key={r.value} value={r.value}>
                     {r.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Notes */}
           <div className="space-y-2">
             <Label htmlFor="pause-notes">Additional notes (optional)</Label>
             <Textarea
               id="pause-notes"
               placeholder="Add any relevant details..."
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               rows={3}
             />
           </div>
 
           {/* Pause End Type */}
           <div className="space-y-3">
             <Label>Pause duration</Label>
             <RadioGroup
               value={pauseEndType}
               onValueChange={(v) => setPauseEndType(v as PauseEndType)}
               className="space-y-2"
             >
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="manual" id="manual" />
                 <Label htmlFor="manual" className="font-normal cursor-pointer">
                   Until manually resumed
                 </Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="scheduled" id="scheduled" />
                 <Label htmlFor="scheduled" className="font-normal cursor-pointer">
                   Until a specific date/time
                 </Label>
               </div>
             </RadioGroup>
 
             {pauseEndType === 'scheduled' && (
               <Input
                 type="datetime-local"
                 value={pauseEndDatetime}
                 onChange={(e) => setPauseEndDatetime(e.target.value)}
                 min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                 className="mt-2"
               />
             )}
           </div>
 
           {/* Warning */}
           <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex gap-3">
             <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
             <p className="text-sm text-muted-foreground">
               While paused, health monitoring and alerts will be suspended. Data entry will be
               disabled. Changes are audit logged.
             </p>
           </div>
         </div>
 
         <DialogFooter className="gap-2 sm:gap-0">
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Cancel
           </Button>
           <Button
             onClick={handleConfirm}
             disabled={isSubmitting || (pauseEndType === 'scheduled' && !pauseEndDatetime)}
             className="bg-warning hover:bg-warning/90 text-warning-foreground"
           >
             {isSubmitting ? 'Pausing...' : 'Confirm Pause'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }