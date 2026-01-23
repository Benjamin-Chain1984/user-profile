/**
 * Continence Export Reports - PDF/CSV export
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePadChanges, useSkinChecks, useUTITests, useConsumablesChecks } from '@/hooks/useContinence';
import { format, subDays, subMonths, startOfYear } from 'date-fns';
import { FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ContinenceExportReportsProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DATE_PRESETS = [
  { label: 'Last 7 Days', getValue: () => subDays(new Date(), 7) },
  { label: 'Last 30 Days', getValue: () => subDays(new Date(), 30) },
  { label: 'Last 3 Months', getValue: () => subMonths(new Date(), 3) },
  { label: 'Year to Date', getValue: () => startOfYear(new Date()) },
];

export function ContinenceExportReports({ clientId, open, onOpenChange }: ContinenceExportReportsProps) {
  const { changes } = usePadChanges(clientId);
  const { checks: skinChecks } = useSkinChecks(clientId);
  const { tests: utiTests } = useUTITests(clientId);
  const { checks: consumablesChecks } = useConsumablesChecks(clientId);

  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPreset, setSelectedPreset] = useState<string | null>('Last 30 Days');

  const applyPreset = (preset: typeof DATE_PRESETS[0]) => {
    setStartDate(format(preset.getValue(), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedPreset(preset.label);
  };

  const filterByDateRange = <T extends { created_at?: string; event_occurred_at?: string; check_date?: string; test_date?: string }>(
    items: T[]
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return items.filter((item) => {
      const dateStr = item.event_occurred_at || item.check_date || item.test_date || item.created_at;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= start && date <= end;
    });
  };

  const exportCSV = () => {
    const filteredChanges = filterByDateRange(changes);
    
    const headers = ['Date', 'Time', 'Pad Type', 'Condition', 'Reason', 'Notes', 'Recorded By', 'On Behalf Of'];
    const rows = filteredChanges.map((c) => [
      format(new Date(c.event_occurred_at), 'yyyy-MM-dd'),
      format(new Date(c.event_occurred_at), 'HH:mm'),
      c.pad_type,
      c.pad_condition,
      c.change_reason,
      c.notes || '',
      c.created_by || '',
      c.recorded_on_behalf_of_name || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `continence-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const filteredChanges = filterByDateRange(changes);
    const filteredSkinChecks = filterByDateRange(skinChecks);
    
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text('Continence Management Report', 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Period: ${format(new Date(startDate), 'PP')} to ${format(new Date(endDate), 'PP')}`, 20, y);
    y += 15;

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Pad Changes: ${filteredChanges.length}`, 20, y);
    y += 5;
    doc.text(`Total Skin Checks: ${filteredSkinChecks.length}`, 20, y);
    y += 15;

    // Pad Changes
    doc.setFontSize(14);
    doc.text('Pad Changes', 20, y);
    y += 8;
    doc.setFontSize(9);

    filteredChanges.slice(0, 20).forEach((c) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const line = `${format(new Date(c.event_occurred_at), 'PP HH:mm')} - ${c.pad_type} (${c.pad_condition}) - ${c.change_reason}`;
      doc.text(line, 20, y);
      y += 5;
    });

    doc.save(`continence-report-${startDate}-to-${endDate}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Continence Report
          </DialogTitle>
          <DialogDescription>
            Generate reports for NDIS funding reviews and clinical documentation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Presets */}
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => (
              <Badge
                key={preset.label}
                variant={selectedPreset === preset.label ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Badge>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPreset(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPreset(null);
                }}
              />
            </div>
          </div>

          {/* Preview Stats */}
          <div className="p-4 bg-muted rounded-lg space-y-1 text-sm">
            <p><strong>Pad Changes:</strong> {filterByDateRange(changes).length}</p>
            <p><strong>Skin Checks:</strong> {filterByDateRange(skinChecks).length}</p>
            <p><strong>UTI Tests:</strong> {filterByDateRange(utiTests).length}</p>
            <p><strong>Stock Checks:</strong> {filterByDateRange(consumablesChecks).length}</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={exportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
