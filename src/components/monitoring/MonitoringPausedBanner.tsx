 import { PauseCircle } from 'lucide-react';
 import { formatDistanceToNow, format } from 'date-fns';
 import { PAUSE_REASONS } from '@/types/monitoringStatus';
 
 interface MonitoringPausedBannerProps {
   pauseReason: string | null;
   pauseStartDatetime: string | null;
   pauseEndDatetime: string | null;
   className?: string;
 }
 
 export function MonitoringPausedBanner({
   pauseReason,
   pauseStartDatetime,
   pauseEndDatetime,
   className = '',
 }: MonitoringPausedBannerProps) {
   const reasonLabel = PAUSE_REASONS.find((r) => r.value === pauseReason)?.label || pauseReason || 'Paused';
 
   const pausedAgo = pauseStartDatetime
     ? formatDistanceToNow(new Date(pauseStartDatetime), { addSuffix: true })
     : '';
 
   const resumeInfo = pauseEndDatetime
     ? `Auto-resumes ${format(new Date(pauseEndDatetime), 'MMM d, yyyy h:mm a')}`
     : 'Until manually resumed';
 
   return (
     <div
       className={`bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center gap-3 ${className}`}
     >
       <div className="p-2 bg-warning/20 rounded-full shrink-0">
         <PauseCircle className="h-5 w-5 text-warning" />
       </div>
       <div className="flex-1 min-w-0">
         <h3 className="font-semibold text-foreground flex items-center gap-2">
           ⏸ Monitoring Paused
         </h3>
         <p className="text-sm text-muted-foreground">
           {reasonLabel} • {pausedAgo}
         </p>
         <p className="text-xs text-muted-foreground/70 mt-0.5">{resumeInfo}</p>
       </div>
     </div>
   );
 }