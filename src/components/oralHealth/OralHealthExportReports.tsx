/**
 * Oral Health Export Reports
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOralHealthAssessments, useOralHealthTaskLogs, useOralHealthConfig } from '@/hooks/useOralHealth';
import { format, parseISO, subDays, subMonths } from 'date-fns';
import { FileDown, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import type { MouthAnnotation } from '@/types/oralHealth';

interface Props {
  clientId?: string;
  onClose: () => void;
}

export function OralHealthExportReports({ clientId, onClose }: Props) {
  const { assessments } = useOralHealthAssessments(clientId);
  const { logs } = useOralHealthTaskLogs(clientId);
  const { config } = useOralHealthConfig(clientId);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filteredAssessments = assessments.filter(a => {
    const d = a.created_at.split('T')[0];
    return d >= startDate && d <= endDate;
  });

  const filteredLogs = logs.filter(l => l.log_date >= startDate && l.log_date <= endDate);

  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text('Oral Health Care Report', 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, y);
    y += 8;

    // Compliance
    if (filteredLogs.length > 0) {
      const completed = filteredLogs.filter(l => l.completed).length;
      const percent = Math.round((completed / filteredLogs.length) * 100);
      doc.setFontSize(12);
      doc.text('Compliance Summary', 14, y);
      y += 7;
      doc.setFontSize(10);
      doc.text(`Tasks: ${completed}/${filteredLogs.length} completed (${percent}%)`, 14, y);
      y += 10;
    }

    // Assessments
    if (filteredAssessments.length > 0) {
      doc.setFontSize(12);
      doc.text('Assessment Records', 14, y);
      y += 7;
      filteredAssessments.forEach(a => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`${format(parseISO(a.created_at), 'dd/MM/yyyy HH:mm')} - ${a.overall_status.toUpperCase()} (${a.assessment_trigger})`, 14, y);
        y += 5;
        if (a.action_taken) {
          doc.text(`  Action: ${a.action_taken.replace(/_/g, ' ')}`, 14, y);
          y += 5;
        }
        const annotations = (a.mouth_annotations || []) as MouthAnnotation[];
        if (annotations.length > 0) {
          doc.text(`  Annotations: ${annotations.map(ann => `${ann.issue_type} at ${ann.location}`).join('; ')}`, 14, y);
          y += 5;
        }
        y += 3;
      });
    }

    // Citation
    y += 5;
    doc.setFontSize(8);
    doc.text('Citation: Pradhan, A. (2013). Oral health impact on quality of life.', 14, y);
    y += 4;
    doc.text('Australian Dental Journal, 58(4), 526-530.', 14, y);

    doc.save(`oral-health-report-${startDate}-${endDate}.pdf`);
  };

  const exportCSV = () => {
    let csv = 'Type,Date,Status,Details\n';
    filteredLogs.forEach(l => {
      csv += `Task,${l.log_date},${l.completed ? 'Completed' : 'Missed'},${l.period.toUpperCase()} ${l.notes || ''}\n`;
    });
    filteredAssessments.forEach(a => {
      csv += `Assessment,${format(parseISO(a.created_at), 'yyyy-MM-dd')},${a.overall_status},${a.action_taken || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oral-health-${startDate}-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onClose}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileDown className="h-5 w-5" /> Export Oral Health Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd')); setEndDate(format(new Date(), 'yyyy-MM-dd')); }}>Last 7 Days</Button>
            <Button variant="outline" size="sm" onClick={() => { setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setEndDate(format(new Date(), 'yyyy-MM-dd')); }}>Last 30 Days</Button>
            <Button variant="outline" size="sm" onClick={() => { setStartDate(format(subMonths(new Date(), 3), 'yyyy-MM-dd')); setEndDate(format(new Date(), 'yyyy-MM-dd')); }}>Last 3 Months</Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Found: {filteredAssessments.length} assessments, {filteredLogs.length} task logs</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={exportPDF}><FileDown className="h-4 w-4 mr-2" /> Download PDF</Button>
            <Button variant="outline" onClick={exportCSV}><FileDown className="h-4 w-4 mr-2" /> Download CSV</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
