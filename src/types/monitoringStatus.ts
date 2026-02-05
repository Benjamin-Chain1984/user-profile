 /**
  * Profile Monitoring Status Types
  * Handles pause/resume functionality for monitoring across all modules
  */
 
 export interface MonitoringStatus {
   id: string;
   clientId: string;
   isPaused: boolean;
   pauseReason: string | null;
   pauseNotes: string | null;
   pauseStartDatetime: string | null;
   pauseEndDatetime: string | null;
   pausedByUserId: string | null;
   resumedByUserId: string | null;
   resumedAt: string | null;
   createdAt: string;
   updatedAt: string;
 }
 
 export type PauseReason = 
   | 'hospital_admission'
   | 'on_holiday'
   | 'respite_stay'
   | 'temporary_transfer'
   | 'other';
 
 export const PAUSE_REASONS: { value: PauseReason; label: string }[] = [
   { value: 'hospital_admission', label: 'Hospital admission' },
   { value: 'on_holiday', label: 'On holiday / away' },
   { value: 'respite_stay', label: 'Respite stay' },
   { value: 'temporary_transfer', label: 'Temporary transfer' },
   { value: 'other', label: 'Other' },
 ];
 
 export type PauseEndType = 'manual' | 'scheduled';