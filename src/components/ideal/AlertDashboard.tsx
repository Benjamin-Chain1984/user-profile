import { useProfile } from '@/contexts/ProfileContext';
import { AlertTriangle, CheckCircle, AlertCircle, ChevronRight, PauseCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function AlertDashboard() {
  const { globalAlertState, isMonitoringPaused } = useProfile();
  const { currentStatus, alerts } = globalAlertState;

  const redAlerts = alerts.filter((a) => a.status === 'red');
  const amberAlerts = alerts.filter((a) => a.status === 'amber');

  // Show paused state when monitoring is suspended
  if (isMonitoringPaused) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/20 rounded-full">
            <PauseCircle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Monitoring Paused</h3>
            <p className="text-sm text-muted-foreground">Alerts are suspended during this pause period</p>
          </div>
        </div>
      </div>
    );
  }

  // Fresh profile with no modules set up — prompt setup instead of showing IDEAL
  if (currentStatus === 'monitor' && redAlerts.length === 0 && amberAlerts.length === 0) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/20 rounded-full">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Setup required</h3>
            <p className="text-sm text-muted-foreground">Enable and configure health modules in the Profile tab to begin monitoring</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show Amber and Red alerts - IDEAL status means no alerts to display
  if (currentStatus === 'stable' || (redAlerts.length === 0 && amberAlerts.length === 0)) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/20 rounded-full">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">All Systems IDEAL</h3>
            <p className="text-sm text-muted-foreground">No alerts requiring attention</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Banner */}
      <div 
        className={`rounded-2xl p-5 ${
          currentStatus === 'action' 
            ? 'bg-destructive/10 border border-destructive/20' 
            : 'bg-warning/10 border border-warning/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            currentStatus === 'action' ? 'bg-destructive/20' : 'bg-warning/20'
          }`}>
            {currentStatus === 'action' ? (
              <AlertCircle className="w-6 h-6 text-destructive" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-warning" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {redAlerts.length > 0 && `${redAlerts.length} Red alert${redAlerts.length > 1 ? 's' : ''} – immediate action required`}
              {redAlerts.length === 0 && amberAlerts.length > 0 && `${amberAlerts.length} Amber alert${amberAlerts.length > 1 ? 's' : ''} require follow-up`}
            </h3>
            <p className="text-sm text-muted-foreground">
              Review and respond to alerts below
            </p>
          </div>
        </div>
      </div>

      {/* Individual Alerts */}
      <div className="space-y-2">
        {/* Red alerts first */}
        {redAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
        {/* Then amber alerts */}
        {amberAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: { id: string; moduleId: string; moduleName: string; message: string; status: 'red' | 'amber'; timestamp: string } }) {
  const navigate = useNavigate();
  const isRed = alert.status === 'red';
  const isFluidRestrictionExceeded = alert.moduleId === 'fluid-balance' && isRed && alert.message.toLowerCase().includes('restriction exceeded');
  
  const handleClick = () => {
    // Navigate to the module page
    navigate(`/module/${alert.moduleId}`);
  };
  
  return (
    <button 
      onClick={handleClick}
      className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
        isRed 
          ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40' 
          : 'bg-warning/5 border-warning/20 hover:border-warning/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isRed ? 'bg-destructive animate-pulse-gentle' : 'bg-warning'}`} />
          <div>
            <p className="font-medium text-foreground">{alert.moduleName}</p>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
            {isFluidRestrictionExceeded && (
              <p className="text-sm font-medium text-destructive mt-1">
                ⚠️ Seek medical advice
              </p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
      </div>
    </button>
  );
}
