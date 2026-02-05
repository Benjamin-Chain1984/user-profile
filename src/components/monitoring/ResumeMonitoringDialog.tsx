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
 import { Play, Info } from 'lucide-react';
 
 interface ResumeMonitoringDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => Promise<boolean>;
 }
 
 export function ResumeMonitoringDialog({
   open,
   onOpenChange,
   onConfirm,
 }: ResumeMonitoringDialogProps) {
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const handleConfirm = async () => {
     setIsSubmitting(true);
     const success = await onConfirm();
     setIsSubmitting(false);
     if (success) {
       onOpenChange(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Play className="h-5 w-5 text-success" />
             Resume Monitoring
           </DialogTitle>
           <DialogDescription>
             Reactivate health monitoring, alerts, and clinical algorithms.
           </DialogDescription>
         </DialogHeader>
 
         <div className="py-4">
           <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
             <div className="flex gap-3">
               <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
               <div className="text-sm text-muted-foreground space-y-2">
                 <p>
                   <strong>What happens when you resume:</strong>
                 </p>
                 <ul className="list-disc list-inside space-y-1">
                   <li>Monitoring resumes immediately</li>
                   <li>Alerts recalculate from the resume time forward</li>
                   <li>No retroactive alerts for the paused period</li>
                   <li>Timers (e.g. "days since last bowel motion") restart from now</li>
                 </ul>
               </div>
             </div>
           </div>
         </div>
 
         <DialogFooter className="gap-2 sm:gap-0">
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Cancel
           </Button>
           <Button
             onClick={handleConfirm}
             disabled={isSubmitting}
             className="bg-success hover:bg-success/90 text-success-foreground"
           >
             {isSubmitting ? 'Resuming...' : 'Resume Monitoring'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }