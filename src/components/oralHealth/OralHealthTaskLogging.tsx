/**
 * Oral Health Task Logging - AM/PM compliance
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useOralHealthTaskLogs } from '@/hooks/useOralHealth';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, Sun, Moon, ClipboardCheck } from 'lucide-react';

interface Props {
  clientId?: string;
}

export function OralHealthTaskLogging({ clientId }: Props) {
  const { logs, logTask, isLogging } = useOralHealthTaskLogs(clientId);
  const [notes, setNotes] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const todayLogs = logs.filter(l => l.log_date === today);
  const amDone = todayLogs.some(l => l.period === 'am' && l.completed);
  const pmDone = todayLogs.some(l => l.period === 'pm' && l.completed);

  const handleLog = (period: 'am' | 'pm', completed: boolean) => {
    logTask({ period, completed, notes: notes || undefined, log_date: today });
    setNotes('');
  };

  // Compliance stats
  const last7 = logs.filter(l => {
    const d = parseISO(l.log_date);
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const completedCount = last7.filter(l => l.completed).length;
  const totalCount = last7.length;
  const compliancePercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Today's Oral Health Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* AM */}
            <Card className={`p-4 ${amDone ? 'bg-success/5 border-success/30' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-warning" />
                  <span className="font-medium">AM Care</span>
                </div>
                {amDone && <Badge variant="outline" className="text-success text-xs">Done</Badge>}
              </div>
              {!amDone ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button className="w-full" size="sm" onClick={() => handleLog('am', true)} disabled={isLogging}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Complete
                  </Button>
                  <Button className="w-full" size="sm" variant="outline" onClick={() => handleLog('am', false)} disabled={isLogging}>
                    <XCircle className="h-4 w-4 mr-1" /> Missed
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Completed</p>
              )}
            </Card>

            {/* PM */}
            <Card className={`p-4 ${pmDone ? 'bg-success/5 border-success/30' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-primary" />
                  <span className="font-medium">PM Care</span>
                </div>
                {pmDone && <Badge variant="outline" className="text-success text-xs">Done</Badge>}
              </div>
              {!pmDone ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button className="w-full" size="sm" onClick={() => handleLog('pm', true)} disabled={isLogging}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Complete
                  </Button>
                  <Button className="w-full" size="sm" variant="outline" onClick={() => handleLog('pm', false)} disabled={isLogging}>
                    <XCircle className="h-4 w-4 mr-1" /> Missed
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Completed</p>
              )}
            </Card>
          </div>

          <Textarea
            placeholder="Additional notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${compliancePercent >= 90 ? 'text-success' : compliancePercent >= 70 ? 'text-warning' : 'text-destructive'}`}>
              {compliancePercent}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${compliancePercent >= 90 ? 'bg-success' : compliancePercent >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                  style={{ width: `${compliancePercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedCount}/{totalCount} tasks completed (last 7 days)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Task History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks logged yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {logs.slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    {log.period === 'am' ? <Sun className="h-3 w-3 text-warning" /> : <Moon className="h-3 w-3 text-primary" />}
                    <span className="text-sm">{format(parseISO(log.log_date), 'dd MMM yyyy')}</span>
                    <Badge variant="outline" className="text-xs uppercase">{log.period}</Badge>
                  </div>
                  <Badge variant={log.completed ? 'default' : 'destructive'} className="text-xs">
                    {log.completed ? 'Done' : 'Missed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
