/**
 * Epilepsy Export Reports - PDF/CSV generation
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSeizureEvents, useEpilepsyConfig, useSeizureActions } from '@/hooks/useEpilepsy';
import { FileDown, ArrowLeft } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface EpilepsyExportReportsProps {
  clientId?: string;
  onClose: () => void;
}

export function EpilepsyExportReports({ clientId, onClose }: EpilepsyExportReportsProps) {
  const { events } = useSeizureEvents(clientId, 500);
  const { config } = useEpilepsyConfig(clientId);
  const { actions } = useSeizureActions(clientId);

  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [includeConfig, setIncludeConfig] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);

  const filteredEvents = events.filter(e => {
    const d = e.event_occurred_at.split('T')[0];
    return d >= startDate && d <= endDate;
  });

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Duration (min)', 'Type', 'Triggers', 'Recovery', 'Notes'];
    const rows = filteredEvents.map(e => [
      format(new Date(e.event_occurred_at), 'dd/MM/yyyy'),
      format(new Date(e.event_occurred_at), 'HH:mm'),
      `${e.duration_minutes}m ${e.duration_seconds}s`,
      e.seizure_type,
      e.triggers.join('; '),
      e.recovery.join('; '),
      e.notes || '',
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epilepsy-report-${startDate}-to-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Export Epilepsy Report</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            {[
              { label: 'Last 7 days', days: 7 },
              { label: 'Last 30 days', days: 30 },
              { label: 'Last 90 days', days: 90 },
              { label: 'Last year', days: 365 },
            ].map(preset => (
              <Button key={preset.days} variant="outline" size="sm" onClick={() => {
                setStartDate(format(subDays(new Date(), preset.days), 'yyyy-MM-dd'));
                setEndDate(format(new Date(), 'yyyy-MM-dd'));
              }}>
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={includeConfig} onCheckedChange={v => setIncludeConfig(v as boolean)} />
              <Label>Include configuration summary</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={includeTrends} onCheckedChange={v => setIncludeTrends(v as boolean)} />
              <Label>Include trend statistics</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={includeActions} onCheckedChange={v => setIncludeActions(v as boolean)} />
              <Label>Include emergency actions</Label>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p><strong>{filteredEvents.length}</strong> seizure event(s) in selected period</p>
          </div>

          <Button onClick={handleExportCSV} className="w-full" size="lg">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV Report
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Designed for neurologist review, GP review, medication optimisation, NDIS clinical evidence, and behaviour support planning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
