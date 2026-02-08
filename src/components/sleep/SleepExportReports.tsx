/**
 * Sleep Export Reports - Generate PDF/CSV reports with awakening detail
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSleepEntries, useSleepConfig } from '@/hooks/useSleep';
import { getAwakeningCount, estimateAwakeMinutes } from '@/types/sleep';
import { format, subDays, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { FileDown, ArrowLeft, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface SleepExportReportsProps {
  clientId?: string;
  onClose: () => void;
}

type DateRangePreset = 'last7' | 'last30';

export function SleepExportReports({ clientId, onClose }: SleepExportReportsProps) {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last7');
  const [exporting, setExporting] = useState(false);
  const { entries } = useSleepEntries(clientId, 500);
  const { config } = useSleepConfig(clientId);

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = datePreset === 'last30' ? subMonths(end, 1) : subDays(end, 7);
    return { start, end };
  }, [datePreset]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e =>
      isWithinInterval(new Date(e.event_occurred_at), {
        start: startOfDay(dateRange.start),
        end: endOfDay(dateRange.end),
      })
    );
  }, [entries, dateRange]);

  const stats = useMemo(() => {
    if (!filteredEntries.length) return null;
    const totalHours = filteredEntries.reduce((s, e) => s + Number(e.estimated_hours_slept), 0);
    const avgHours = totalHours / filteredEntries.length;
    const disruptedNights = filteredEntries.filter(e => Number(e.estimated_hours_slept) < (config.min_expected_sleep_hours ?? 7)).length;
    const totalAssistance = filteredEntries.reduce((s, e) => s + e.assistance_types.length, 0);
    const totalAwakenings = filteredEntries.reduce((s, e) => s + getAwakeningCount(e), 0);
    return { avgHours, disruptedNights, totalAssistance, totalEntries: filteredEntries.length, totalAwakenings };
  }, [filteredEntries, config]);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Sleep Chart Report', 20, 20);
      doc.setFontSize(10);
      doc.text(`Period: ${format(dateRange.start, 'dd/MM/yyyy')} – ${format(dateRange.end, 'dd/MM/yyyy')}`, 20, 30);
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 36);

      if (stats) {
        doc.setFontSize(12);
        doc.text('Summary', 20, 50);
        doc.setFontSize(10);
        doc.text(`Average sleep: ${stats.avgHours.toFixed(1)} hours`, 20, 58);
        doc.text(`Disrupted nights: ${stats.disruptedNights} of ${stats.totalEntries}`, 20, 64);
        doc.text(`Total awakenings: ${stats.totalAwakenings}`, 20, 70);
        doc.text(`Overnight assistance events: ${stats.totalAssistance}`, 20, 76);
      }

      let y = 91;
      doc.setFontSize(12);
      doc.text('Entries', 20, y);
      y += 8;
      doc.setFontSize(9);

      filteredEntries.forEach(e => {
        if (y > 270) { doc.addPage(); y = 20; }
        const awakenings = getAwakeningCount(e);
        const hasEvents = e.awakening_events?.length > 0;
        const line = `${format(new Date(e.event_occurred_at), 'dd/MM')} | ${Number(e.estimated_hours_slept).toFixed(1)}h | ${awakenings} awakenings${e.restlessness ? ' | Restless' : ''}${e.notes ? ` | ${e.notes}` : ''}`;
        doc.text(line, 20, y);
        y += 6;

        // Awakening detail
        if (hasEvents) {
          e.awakening_events.forEach((evt, i) => {
            if (y > 270) { doc.addPage(); y = 20; }
            const dur = evt.duration_category === 'less_than_10' ? '<10min' : evt.duration_category === '10_to_30' ? '10-30min' : '>30min';
            const reason = evt.reason && evt.reason !== 'unknown' ? ` (${evt.reason})` : '';
            doc.text(`  Awakening ${i + 1}: ${dur}${reason}`, 25, y);
            y += 5;
          });
        }
      });

      y += 10;
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(8);
      doc.text('This report supports care planning only. Consult a GP or health professional if concerns persist.', 20, y);

      doc.save(`sleep-report-${format(new Date(), 'yyyyMMdd')}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Bedtime', 'Wake Time', 'Hours Slept', 'Awakenings', 'Awakening Details', 'Restless', 'Nap', 'Assistance', 'Notes'];
    const rows = filteredEntries.map(e => {
      const hasEvents = e.awakening_events?.length > 0;
      const awakeningDetail = hasEvents
        ? e.awakening_events.map((evt, i) => {
          const dur = evt.duration_category === 'less_than_10' ? '<10min' : evt.duration_category === '10_to_30' ? '10-30min' : '>30min';
          return `#${i + 1}:${dur}${evt.reason ? `(${evt.reason})` : ''}`;
        }).join('; ')
        : '';
      return [
        format(new Date(e.event_occurred_at), 'yyyy-MM-dd'),
        format(new Date(e.bedtime), 'HH:mm'),
        format(new Date(e.wake_time), 'HH:mm'),
        Number(e.estimated_hours_slept).toFixed(1),
        getAwakeningCount(e),
        awakeningDetail,
        e.restlessness ? 'Yes' : 'No',
        e.day_nap ? `Yes (${e.day_nap_duration_minutes || 0}min)` : 'No',
        e.assistance_types.join('; '),
        e.notes || '',
      ];
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sleep-report-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onClose} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Sleep Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {(['last7', 'last30'] as const).map(p => (
              <Button key={p} variant={datePreset === p ? 'default' : 'outline'} size="sm" onClick={() => setDatePreset(p)}>
                {p === 'last7' ? 'Last 7 Days' : 'Last 30 Days'}
              </Button>
            ))}
          </div>

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-lg font-bold">{stats.avgHours.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Avg Sleep</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{stats.disruptedNights}</p>
                <p className="text-xs text-muted-foreground">Disrupted</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{stats.totalAwakenings}</p>
                <p className="text-xs text-muted-foreground">Awakenings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{stats.totalAssistance}</p>
                <p className="text-xs text-muted-foreground">Assistance</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button onClick={exportPDF} disabled={exporting || !filteredEntries.length}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Export PDF
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={!filteredEntries.length}>
            Export CSV
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
