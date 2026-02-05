 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Pause, Play } from 'lucide-react';
 import { PauseMonitoringDialog } from './PauseMonitoringDialog';
 import { ResumeMonitoringDialog } from './ResumeMonitoringDialog';
 import type { PauseReason, PauseEndType } from '@/types/monitoringStatus';
 
 interface PauseResumeButtonProps {
   isPaused: boolean;
   onPause: (data: {
     reason: PauseReason;
     notes?: string;
     pauseStartDatetime: string;
     pauseEndType: PauseEndType;
     pauseEndDatetime?: string;
   }) => Promise<boolean>;
   onResume: () => Promise<boolean>;
 }
 
 export function PauseResumeButton({ isPaused, onPause, onResume }: PauseResumeButtonProps) {
   const [showPauseDialog, setShowPauseDialog] = useState(false);
   const [showResumeDialog, setShowResumeDialog] = useState(false);
 
   if (isPaused) {
     return (
       <>
         <Button
           onClick={() => setShowResumeDialog(true)}
           className="bg-success hover:bg-success/90 text-success-foreground"
         >
           <Play className="h-4 w-4 mr-2" />
           Resume Monitoring
         </Button>
         <ResumeMonitoringDialog
           open={showResumeDialog}
           onOpenChange={setShowResumeDialog}
           onConfirm={onResume}
         />
       </>
     );
   }
 
   return (
     <>
       <Button
         variant="outline"
         onClick={() => setShowPauseDialog(true)}
         className="border-warning/50 text-warning hover:bg-warning/10"
       >
         <Pause className="h-4 w-4 mr-2" />
         Pause Monitoring
       </Button>
       <PauseMonitoringDialog
         open={showPauseDialog}
         onOpenChange={setShowPauseDialog}
         onConfirm={onPause}
       />
     </>
   );
 }