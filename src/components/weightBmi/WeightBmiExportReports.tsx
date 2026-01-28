/**
 * Weight & BMI Export Reports - PDF/CSV export functionality
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useWeightBmi } from '@/hooks/useWeightBmi';
import { useToast } from '@/hooks/use-toast';
import { 
  FileDown, 
  FileText, 
  Table, 
  ArrowLeft,
  Calendar,
  Scale
} from 'lucide-react';
import { format, subDays, subMonths, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { jsPDF } from 'jspdf';
import { BMI_CATEGORY_CONFIG, FREQUENCY_LABELS, HEIGHT_METHOD_LABELS } from '@/types/weightBmi';

interface WeightBmiExportReportsProps {
  clientId?: string;
  onClose: () => void;
}

type DatePreset = '7d' | '30d' | 'month' | 'year' | 'custom';

export function WeightBmiExportReports({ clientId, onClose }: WeightBmiExportReportsProps) {
  const { entries, config, alerts, loading } = useWeightBmi(clientId);
  const { toast } = useToast();
  
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [includeConfig, setIncludeConfig] = useState(true);
  const [includeEntries, setIncludeEntries] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);

  // Calculate date range
  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const end = endOfDay(now);
    
    switch (datePreset) {
      case '7d':
        return { start: startOfDay(subDays(now, 7)), end };
      case '30d':
        return { start: startOfDay(subDays(now, 30)), end };
      case 'month':
        return { start: startOfDay(subMonths(now, 1)), end };
      case 'year':
        return { start: startOfDay(subMonths(now, 12)), end };
      case 'custom':
        return {
          start: customStart ? startOfDay(new Date(customStart)) : startOfDay(subDays(now, 30)),
          end: customEnd ? endOfDay(new Date(customEnd)) : end
        };
      default:
        return { start: startOfDay(subDays(now, 30)), end };
    }
  };

  // Filter entries by date range
  const getFilteredEntries = () => {
    const { start, end } = getDateRange();
    return entries.filter(e => {
      const entryDate = parseISO(e.event_occurred_at);
      return isWithinInterval(entryDate, { start, end });
    });
  };

  // Generate PDF
  const generatePDF = () => {
    const filteredEntries = getFilteredEntries();
    const { start, end } = getDateRange();
    
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.text('Weight & BMI Monitoring Report', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Report Period: ${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`, 20, yPos);
    yPos += 5;
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPos);
    yPos += 15;

    // Configuration Summary
    if (includeConfig && config) {
      doc.setFontSize(14);
      doc.text('Configuration Summary', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      const configLines = [
        `Monitoring Frequency: ${FREQUENCY_LABELS[config.monitoring_frequency]}`,
        `Height: ${config.height_cm ? `${config.height_cm} cm (${HEIGHT_METHOD_LABELS[config.height_method]})` : 'Not configured'}`,
        config.min_target_weight_kg || config.max_target_weight_kg
          ? `Target Range: ${config.min_target_weight_kg || '—'} - ${config.max_target_weight_kg || '—'} kg`
          : '',
        config.enable_rapid_change_alert
          ? `Rapid Change Alert: ${config.rapid_change_threshold_kg}kg in ${config.rapid_change_window_days} days`
          : ''
      ].filter(Boolean);

      configLines.forEach(line => {
        doc.text(line, 25, yPos);
        yPos += 5;
      });
      yPos += 10;
    }

    // Trend Statistics
    if (includeTrends && filteredEntries.length > 0) {
      doc.setFontSize(14);
      doc.text('Trend Statistics', 20, yPos);
      yPos += 8;

      const weights = filteredEntries.map(e => e.weight_kg);
      const bmis = filteredEntries.filter(e => e.bmi_value).map(e => e.bmi_value!);
      
      doc.setFontSize(10);
      doc.text(`Entries Recorded: ${filteredEntries.length}`, 25, yPos);
      yPos += 5;
      doc.text(`Weight Range: ${Math.min(...weights).toFixed(1)} - ${Math.max(...weights).toFixed(1)} kg`, 25, yPos);
      yPos += 5;
      if (bmis.length > 0) {
        doc.text(`BMI Range: ${Math.min(...bmis).toFixed(1)} - ${Math.max(...bmis).toFixed(1)}`, 25, yPos);
        yPos += 5;
      }
      doc.text(`Net Change: ${(weights[0] - weights[weights.length - 1]).toFixed(1)} kg`, 25, yPos);
      yPos += 15;
    }

    // Weight Entries
    if (includeEntries && filteredEntries.length > 0) {
      doc.setFontSize(14);
      doc.text('Weight Entries', 20, yPos);
      yPos += 8;

      doc.setFontSize(9);
      filteredEntries.forEach((entry, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const line = `${format(parseISO(entry.event_occurred_at), 'dd MMM yyyy HH:mm')} | ` +
          `${entry.weight_kg} kg` +
          (entry.bmi_value ? ` | BMI: ${entry.bmi_value} (${entry.bmi_category ? BMI_CATEGORY_CONFIG[entry.bmi_category].label : ''})` : '');
        
        doc.text(line, 25, yPos);
        yPos += 5;

        if (entry.notes) {
          doc.setFontSize(8);
          doc.text(`  Notes: ${entry.notes}`, 25, yPos);
          yPos += 4;
          doc.setFontSize(9);
        }
      });
      yPos += 10;
    }

    // Alerts
    if (includeAlerts && alerts.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Alerts', 20, yPos);
      yPos += 8;

      doc.setFontSize(9);
      alerts.forEach(alert => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`[${alert.severity.toUpperCase()}] ${format(parseISO(alert.created_at), 'dd MMM yyyy')} - ${alert.message}`, 25, yPos);
        yPos += 5;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.text('This report is for monitoring purposes only. Follow the person\'s health plan and seek advice from a health professional if concerned.', 20, 285);

    doc.save(`weight-bmi-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: 'PDF Generated',
      description: 'Weight & BMI report has been downloaded'
    });
  };

  // Generate CSV
  const generateCSV = () => {
    const filteredEntries = getFilteredEntries();
    
    const headers = [
      'Date',
      'Time',
      'Weight (kg)',
      'BMI',
      'BMI Category',
      'Time of Day',
      'Meal Timing',
      'Wheelchair Context',
      'Notes',
      'Recorded By',
      'On Behalf Of'
    ];

    const rows = filteredEntries.map(entry => [
      format(parseISO(entry.event_occurred_at), 'yyyy-MM-dd'),
      format(parseISO(entry.event_occurred_at), 'HH:mm'),
      entry.weight_kg.toString(),
      entry.bmi_value?.toString() || '',
      entry.bmi_category ? BMI_CATEGORY_CONFIG[entry.bmi_category].label : '',
      entry.time_of_day || '',
      entry.meal_timing?.replace('_', ' ') || '',
      entry.wheelchair_context?.replace('_', ' ') || '',
      entry.notes || '',
      entry.created_by || '',
      entry.recorded_on_behalf_of_name || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weight-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV Generated',
      description: 'Weight entries have been exported'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileDown className="h-6 w-6" />
            Export Reports
          </h2>
          <p className="text-muted-foreground">
            Generate PDF or CSV exports for clinical review
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Date Range Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <Scale className="h-4 w-4 inline mr-1" />
                <strong>{getFilteredEntries().length}</strong> entries in selected range
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Report Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Include in Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="config"
                checked={includeConfig}
                onCheckedChange={(v) => setIncludeConfig(!!v)}
              />
              <Label htmlFor="config">Configuration Summary</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="entries"
                checked={includeEntries}
                onCheckedChange={(v) => setIncludeEntries(!!v)}
              />
              <Label htmlFor="entries">Weight Entries</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trends"
                checked={includeTrends}
                onCheckedChange={(v) => setIncludeTrends(!!v)}
              />
              <Label htmlFor="trends">Trend Statistics</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="alerts"
                checked={includeAlerts}
                onCheckedChange={(v) => setIncludeAlerts(!!v)}
              />
              <Label htmlFor="alerts">Alerts History</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={generatePDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Generate PDF Report
        </Button>
        <Button variant="outline" onClick={generateCSV} className="gap-2">
          <Table className="h-4 w-4" />
          Export CSV Data
        </Button>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground border-t pt-4">
        <p>Reports include full audit trail with staff attribution. Suitable for GP reviews, dietitian input, and NDIS funding submissions.</p>
      </div>
    </div>
  );
}
