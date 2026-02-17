/**
 * Pressure Area Prevention Export Reports
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePressureReliefEvents, useSkinChecks } from '@/hooks/usePressureArea';
import jsPDF from 'jspdf';
import { ArrowLeft, FileDown } from 'lucide-react';
import { subDays, subMonths, format } from 'date-fns';

interface Props {
  clientId?: string;
  onClose: () => void;
}

export function PressureAreaExportReports({ clientId, onClose }: Props) {
  const { events } = usePressureReliefEvents(clientId);
  const { sessions } = useSkinChecks(clientId);
  const [dateRange, setDateRange] = useState('30');

  const getFilteredData = () => {
    const cutoff = dateRange === '7' ? subDays(new Date(), 7)
      : dateRange === '30' ? subDays(new Date(), 30)
      : dateRange === '90' ? subMonths(new Date(), 3)
      : subMonths(new Date(), 12);

    return {
      filteredEvents: events.filter(e => new Date(e.event_occurred_at) >= cutoff),
      filteredSessions: sessions.filter(s => new Date(s.event_occurred_at) >= cutoff),
    };
  };

  const generatePDF = () => {
    const { filteredEvents, filteredSessions } = getFilteredData();
    const doc = new jsPDF();
    const margin = 15;
    let y = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Pressure Area Prevention Report', margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: Last ${dateRange} days | Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Relief Events', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    filteredEvents.forEach(event => {
      if (y > 270) { doc.addPage(); y = 20; }
      const dateStr = format(new Date(event.event_occurred_at), 'dd/MM/yyyy HH:mm');
      doc.text(`${dateStr} — ${event.position_completed}${event.issues?.length ? ` [${event.issues.join(', ')}]` : ''}`, margin + 2, y);
      y += 5;
    });

    y += 6;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Skin Checks', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    filteredSessions.forEach(session => {
      if (y > 270) { doc.addPage(); y = 20; }
      const dateStr = format(new Date(session.event_occurred_at), 'dd/MM/yyyy HH:mm');
      doc.text(`${dateStr} — ${session.overall_status.toUpperCase()}${session.notes ? ` — ${session.notes}` : ''}`, margin + 2, y);
      y += 5;
    });

    y += 8;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Pressure relief and skin checks support prevention and early identification. Seek advice from a health professional if concerns arise.', margin, y);

    doc.save(`pressure-area-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Export Reports</h2>
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Generate Report</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 3 Months</SelectItem>
                <SelectItem value="365">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generatePDF}>
            <FileDown className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
