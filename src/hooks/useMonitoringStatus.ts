 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import type { MonitoringStatus, PauseReason, PauseEndType } from '@/types/monitoringStatus';
 
 interface PauseMonitoringParams {
   reason: PauseReason;
   notes?: string;
   pauseStartDatetime: string;
   pauseEndType: PauseEndType;
   pauseEndDatetime?: string;
 }
 
 export function useMonitoringStatus(clientId: string | null) {
   const [status, setStatus] = useState<MonitoringStatus | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const { toast } = useToast();
 
   const fetchStatus = useCallback(async () => {
     if (!clientId) return;
 
     try {
       const { data, error } = await supabase
         .from('profile_monitoring_status')
         .select('*')
         .eq('client_id', clientId)
         .maybeSingle();
 
       if (error) {
         console.error('Error fetching monitoring status:', error);
         return;
       }
 
       if (data) {
         setStatus({
           id: data.id,
           clientId: data.client_id,
           isPaused: data.is_paused,
           pauseReason: data.pause_reason,
           pauseNotes: data.pause_notes,
           pauseStartDatetime: data.pause_start_datetime,
           pauseEndDatetime: data.pause_end_datetime,
           pausedByUserId: data.paused_by_user_id,
           resumedByUserId: data.resumed_by_user_id,
           resumedAt: data.resumed_at,
           createdAt: data.created_at,
           updatedAt: data.updated_at,
         });
       } else {
         setStatus(null);
       }
     } catch (err) {
       console.error('Error in fetchStatus:', err);
     } finally {
       setIsLoading(false);
     }
   }, [clientId]);
 
   useEffect(() => {
     fetchStatus();
 
     if (!clientId) return;
 
     // Subscribe to realtime updates
     const channel = supabase
       .channel('monitoring-status-updates')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'profile_monitoring_status',
           filter: `client_id=eq.${clientId}`,
         },
         () => {
           fetchStatus();
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [clientId, fetchStatus]);
 
   const pauseMonitoring = async (params: PauseMonitoringParams) => {
     if (!clientId) return false;
 
     const { data: userData } = await supabase.auth.getUser();
     const userId = userData?.user?.id;
 
     const updateData = {
       is_paused: true,
       pause_reason: params.reason === 'other' ? 'Other' : params.reason,
       pause_notes: params.notes || null,
       pause_start_datetime: params.pauseStartDatetime,
       pause_end_datetime: params.pauseEndType === 'scheduled' ? params.pauseEndDatetime : null,
       paused_by_user_id: userId,
       resumed_by_user_id: null,
       resumed_at: null,
     };
 
     try {
       // Check if record exists
       const { data: existing } = await supabase
         .from('profile_monitoring_status')
         .select('id')
         .eq('client_id', clientId)
         .maybeSingle();
 
       if (existing) {
         const { error } = await supabase
           .from('profile_monitoring_status')
           .update(updateData)
           .eq('client_id', clientId);
 
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('profile_monitoring_status')
           .insert({
             client_id: clientId,
             ...updateData,
           });
 
         if (error) throw error;
       }
 
       // Log audit event
       await supabase.rpc('log_audit_event', {
         p_actor_user_id: userId,
         p_action: 'MONITORING_PAUSED',
         p_client_id: clientId,
         p_metadata_json: {
           reason: params.reason,
           notes: params.notes,
           pause_start: params.pauseStartDatetime,
           pause_end: params.pauseEndDatetime || 'manual',
         },
       });
 
       toast({
         title: 'Monitoring Paused',
         description: 'Health monitoring and alerts have been suspended.',
       });
 
       await fetchStatus();
       return true;
     } catch (err) {
       console.error('Error pausing monitoring:', err);
       toast({
         title: 'Error',
         description: 'Failed to pause monitoring. Please try again.',
         variant: 'destructive',
       });
       return false;
     }
   };
 
   const resumeMonitoring = async () => {
     if (!clientId) return false;
 
     const { data: userData } = await supabase.auth.getUser();
     const userId = userData?.user?.id;
 
     try {
       const { error } = await supabase
         .from('profile_monitoring_status')
         .update({
           is_paused: false,
           resumed_by_user_id: userId,
           resumed_at: new Date().toISOString(),
         })
         .eq('client_id', clientId);
 
       if (error) throw error;
 
       // Log audit event
       await supabase.rpc('log_audit_event', {
         p_actor_user_id: userId,
         p_action: 'MONITORING_RESUMED',
         p_client_id: clientId,
         p_metadata_json: {
           resumed_at: new Date().toISOString(),
         },
       });
 
       toast({
         title: 'Monitoring Resumed',
         description: 'Health monitoring and alerts are now active.',
       });
 
       await fetchStatus();
       return true;
     } catch (err) {
       console.error('Error resuming monitoring:', err);
       toast({
         title: 'Error',
         description: 'Failed to resume monitoring. Please try again.',
         variant: 'destructive',
       });
       return false;
     }
   };
 
   return {
     status,
   isPaused: status?.isPaused ?? false,
     isLoading,
     pauseMonitoring,
     resumeMonitoring,
     refreshStatus: fetchStatus,
   };
 }