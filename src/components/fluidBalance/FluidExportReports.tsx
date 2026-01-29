import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText, Download, Calendar } from 'lucide-react';
import { FluidConfig, FluidIntakeEntry, FluidOutputEntry, FluidBalanceAlert } from '@/types/fluidBalance';
import { calculateDailySummaries, getStatusLabel } from '@/utils/fluidBalanceCalculator';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, parseISO } from 'date-fns';
import jsPDF from 'jspdf';

interface FluidExportReportsProps {
  config: FluidConfig | null;
  intakeEntries: FluidIntakeEntry[];
  outputEntries: FluidOutputEntry[];
  alerts: FluidBalanceAlert[];
}

type DatePreset = 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear';

export const FluidExportReports: React.FC<FluidExportReportsProps> = ({
  config,
  intakeEntries,
  outputEntries,
  alerts
}) => {
  const [datePreset, setDatePreset] = useState<DatePreset>('last7');
  const [includeSections, setIncludeSections] = useState({
    config: true,
    dailySummaries: true,
    intakeLog: true,
    outputLog: true,
    alerts: true
  });
  
  const getDateRange = () => {
    const now = new Date();
    switch (datePreset) {
      case 'last7':
        return { start: subDays(now, 7), end: now };
      case 'last30':
        return { start: subDays(now, 30), end: now };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'thisYear':
        return { start: startOfYear(now), end: now };
      default:
        return { start: subDays(now, 7), end: now };
    }
  };
  
  const filterByDateRange = <T extends { event_occurred_at?: string; created_at?: string }>(
    items: T[]
  ): T[] => {
    const { start, end } = getDateRange();
    return items.filter(item => {
      const date = parseISO(item.event_occurred_at || item.created_at || '');
      return date >= start && date <= end;
    });
  };
  
  const generatePDF = () => {
    const doc = new jsPDF();
    const { start, end } = getDateRange();
    let yPos = 20;
    
    // Header
    doc.setFontSize(18);
    doc.text('Fluid Balance Report', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Report Period: ${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`, 20, yPos);
    yPos += 5;
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPos);
    yPos += 15;
    
    // Configuration summary
    if (includeSections.config && config) {
      doc.setFontSize(14);
      doc.text('Configuration', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.text(`Target Daily Intake: ${config.target_daily_intake_ml}ml`, 25, yPos);
      yPos += 5;
      doc.text(`Output Logging: ${config.enable_output_logging ? 'Enabled' : 'Disabled'}`, 25, yPos);
      yPos += 5;
      
      if (config.enable_output_logging) {
        doc.text(`Dehydration Threshold: ${config.dehydration_threshold_ml}ml`, 25, yPos);
        yPos += 5;
        doc.text(`Overhydration Threshold: ${config.overhydration_threshold_ml}ml`, 25, yPos);
        yPos += 5;
      }
      
      if (config.fluid_restriction_enabled) {
        doc.text(`Fluid Restriction: ${config.max_fluid_allowance_ml}ml/day`, 25, yPos);
        yPos += 5;
      }
      yPos += 10;
    }
    
    // Daily summaries
    if (includeSections.dailySummaries && config) {
      const days = Math.ceil((getDateRange().end.getTime() - getDateRange().start.getTime()) / (1000 * 60 * 60 * 24));
      const summaries = calculateDailySummaries(
        filterByDateRange(intakeEntries),
        filterByDateRange(outputEntries),
        config,
        days
      );
      
      doc.setFontSize(14);
      doc.text('Daily Summaries', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      summaries.slice(0, 14).forEach(summary => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const line = `${summary.date}: Intake ${summary.totalIntake}ml${
          config.enable_output_logging ? ` | Output ${summary.totalOutput}ml | Balance ${summary.balance >= 0 ? '+' : ''}${summary.balance}ml` : ''
        } (${summary.percentOfTarget}% of target) - ${getStatusLabel(summary.status)}`;
        doc.text(line, 25, yPos);
        yPos += 5;
      });
      yPos += 10;
    }
    
    // Alerts
    if (includeSections.alerts) {
      const filteredAlerts = filterByDateRange(alerts);
      if (filteredAlerts.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Alerts', 20, yPos);
        yPos += 8;
        
        doc.setFontSize(9);
        filteredAlerts.forEach(alert => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`[${alert.severity.toUpperCase()}] ${format(parseISO(alert.created_at), 'dd/MM/yy HH:mm')}: ${alert.message}`, 25, yPos);
          yPos += 5;
        });
      }
    }
    
    // Footer disclaimer
    doc.addPage();
    doc.setFontSize(8);
    doc.text('CLINICAL DISCLAIMER', 20, 20);
    doc.text('This report is for monitoring purposes only. Clinical decisions should be made by qualified healthcare professionals.', 20, 28);
    doc.text('Targets and thresholds should be set by a clinician, dietitian, or GP.', 20, 34);
    
    doc.save(`fluid-balance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };
  
  const generateCSV = () => {
    const { start, end } = getDateRange();
    const filteredIntake = filterByDateRange(intakeEntries);
    const filteredOutput = filterByDateRange(outputEntries);
    
    let csv = 'Fluid Balance Export\n';
    csv += `Report Period,${format(start, 'yyyy-MM-dd')},${format(end, 'yyyy-MM-dd')}\n\n`;
    
    if (includeSections.intakeLog) {
      csv += 'INTAKE LOG\n';
      csv += 'Timestamp,Fluid Type,Amount (ml),Self-Reported,Notes,Logged By\n';
      filteredIntake.forEach(entry => {
        csv += `${entry.event_occurred_at},${entry.fluid_type},${entry.amount_ml},${entry.is_self_reported},"${entry.notes || ''}","${entry.recorded_on_behalf_of_name || 'System User'}"\n`;
      });
      csv += '\n';
    }
    
    if (includeSections.outputLog && config?.enable_output_logging) {
      csv += 'OUTPUT LOG\n';
      csv += 'Timestamp,Output Type,Amount (ml),Unmeasured,Urine Colour,Notes\n';
      filteredOutput.forEach(entry => {
        csv += `${entry.event_occurred_at},${entry.output_type},${entry.amount_ml || 'N/A'},${entry.is_unmeasured},${entry.urine_colour || 'N/A'},"${entry.notes || ''}"\n`;
      });
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluid-balance-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Export Reports
        </CardTitle>
        <CardDescription>
          Generate PDF or CSV reports for clinical review and NDIS funding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date range selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Label>
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Section toggles */}
        <div className="space-y-3">
          <Label>Include Sections</Label>
          {Object.entries(includeSections).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={value}
                onCheckedChange={(checked) => 
                  setIncludeSections(prev => ({ ...prev, [key]: !!checked }))
                }
              />
              <Label htmlFor={key} className="text-sm capitalize cursor-pointer">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
            </div>
          ))}
        </div>
        
        {/* Export buttons */}
        <div className="flex gap-3">
          <Button onClick={generatePDF} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={generateCSV} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
