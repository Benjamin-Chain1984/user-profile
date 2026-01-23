/**
 * Bowel Care Export Reports - Generate PDF/CSV reports for professionals
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useBowelLogs, usePrnAdministrations, useBowelCareConfig } from '@/hooks/useBowelCare';
import { BowelLogEntry, PrnAdministration, BRISTOL_TYPES, STOOL_SIZES, STAFF_ROLES, ON_BEHALF_REASONS } from '@/types/bowelCare';
import { format, isWithinInterval, startOfDay, endOfDay, subDays, subMonths, subYears } from 'date-fns';
import { CalendarIcon, FileDown, FileText, Table, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface BowelCareExportReportsProps {
  clientId?: string;
  onClose: () => void;
}

type DateRangePreset = 'last7' | 'last30' | 'lastMonth' | 'lastYear' | 'custom';

interface ExportData {
  logs: BowelLogEntry[];
  prnAdministrations: PrnAdministration[];
  profiles: Record<string, string>;
}

export function BowelCareExportReports({ clientId, onClose }: BowelCareExportReportsProps) {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last7');
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [includeConfig, setIncludeConfig] = useState(true);
  const [includePrn, setIncludePrn] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);

  const { logs } = useBowelLogs(clientId, 500);
  const { administrations } = usePrnAdministrations(clientId);
  const { config } = useBowelCareConfig(clientId);

  // Handle date preset changes
  const handlePresetChange = (preset: DateRangePreset) => {
    setDatePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case 'last7':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case 'last30':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case 'lastMonth':
        setStartDate(subMonths(now, 1));
        setEndDate(now);
        break;
      case 'lastYear':
        setStartDate(subYears(now, 1));
        setEndDate(now);
        break;
      case 'custom':
        // Keep current dates for custom
        break;
    }
  };

  // Filter logs by date range
  const filteredLogs = useMemo(() => {
    return (logs || []).filter(log => {
      const logDate = new Date(log.entry_time);
      if (startDate && endDate) {
        return isWithinInterval(logDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        });
      }
      if (startDate) return logDate >= startOfDay(startDate);
      if (endDate) return logDate <= endOfDay(endDate);
      return true;
    });
  }, [logs, startDate, endDate]);

  // Filter PRN administrations by date range
  const filteredPrn = useMemo(() => {
    return (administrations || []).filter(admin => {
      const adminDate = new Date(admin.administration_time);
      if (startDate && endDate) {
        return isWithinInterval(adminDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        });
      }
      if (startDate) return adminDate >= startOfDay(startDate);
      if (endDate) return adminDate <= endOfDay(endDate);
      return true;
    });
  }, [administrations, startDate, endDate]);

  // Fetch profile data for staff names
  useEffect(() => {
    async function fetchExportData() {
      if (filteredLogs.length === 0 && filteredPrn.length === 0) {
        setExportData({ logs: [], prnAdministrations: [], profiles: {} });
        return;
      }

      try {
        const creatorIds = [
          ...new Set([
            ...filteredLogs.map(l => l.created_by).filter(Boolean),
            ...filteredPrn.map(p => p.created_by).filter(Boolean)
          ])
        ];

        let profilesMap: Record<string, string> = {};
        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', creatorIds as string[]);

          (profiles || []).forEach((p) => {
            profilesMap[p.id] = p.full_name || 'Unknown';
          });
        }

        setExportData({
          logs: filteredLogs,
          prnAdministrations: filteredPrn,
          profiles: profilesMap,
        });
      } catch (err) {
        console.error('Error fetching export data:', err);
      }
    }

    fetchExportData();
  }, [filteredLogs, filteredPrn]);

  const getBristolLabel = (type: number) => {
    return BRISTOL_TYPES.find(b => b.type === type)?.name || `Type ${type}`;
  };

  const getSizeLabel = (size: string | null) => {
    if (!size) return 'Unknown';
    return STOOL_SIZES.find(s => s.value === size)?.label || size;
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return '';
    return STAFF_ROLES.find(r => r.value === role)?.label || role;
  };

  const getReasonLabel = (reason: string | null) => {
    if (!reason) return '';
    return ON_BEHALF_REASONS.find(r => r.value === reason)?.label || reason;
  };

  const generateCSV = () => {
    if (!exportData) return;
    setExporting(true);

    try {
      const rows: string[][] = [];

      // Header for Bowel Logs
      rows.push(['--- BOWEL LOG ENTRIES ---']);
      rows.push([
        'Event Date/Time',
        'Recorded At',
        'Recorded By',
        'Recorded On Behalf Of',
        'On Behalf Role',
        'On Behalf Reason',
        'Bristol Type',
        'Bristol Name',
        'Stool Size',
        'Observed Status',
        'Pain',
        'Straining',
        'Blood',
        'Mucus',
        'Bloating',
        'Vomiting',
        'Abdominal Pain',
        'Stool Colour',
        'Notes',
      ]);

      exportData.logs.forEach(log => {
        const staffName = log.created_by ? exportData.profiles[log.created_by] || 'Unknown' : 'Unknown';
        const indicators = log.indicators || {};
        const eventTime = log.event_occurred_at || log.entry_time;

        rows.push([
          format(new Date(eventTime), 'yyyy-MM-dd HH:mm'),
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm'),
          staffName,
          log.recorded_on_behalf_of_name || '',
          getRoleLabel(log.recorded_on_behalf_of_role),
          getReasonLabel(log.recorded_on_behalf_of_reason),
          log.bristol_type.toString(),
          getBristolLabel(log.bristol_type),
          getSizeLabel(log.stool_size),
          log.observed_status,
          indicators.pain || 'none',
          indicators.straining ? 'Yes' : 'No',
          indicators.blood || 'none',
          indicators.mucus ? 'Yes' : 'No',
          indicators.bloating ? 'Yes' : 'No',
          indicators.vomiting ? 'Yes' : 'No',
          indicators.abdominal_pain || 'none',
          indicators.stool_colour || 'normal',
          log.notes || '',
        ]);
      });

      if (includePrn && exportData.prnAdministrations.length > 0) {
        rows.push([]);
        rows.push(['--- PRN ADMINISTRATIONS ---']);
        rows.push([
          'Date/Time',
          'Staff Member',
          'Medication',
          'Dose Given',
          'Prior Bristol Type',
          'Bowel Motion Occurred',
          'Outcome Bristol Type',
          'Outcome Recorded At',
          'Notes',
        ]);

        exportData.prnAdministrations.forEach(admin => {
          const staffName = admin.created_by ? exportData.profiles[admin.created_by] || 'Unknown' : 'Unknown';

          rows.push([
            format(new Date(admin.administration_time), 'yyyy-MM-dd HH:mm'),
            staffName,
            admin.medication_name,
            admin.dose_given,
            admin.prior_bristol_type?.toString() || 'N/A',
            admin.bowel_motion_occurred === null ? 'Pending' : admin.bowel_motion_occurred ? 'Yes' : 'No',
            admin.outcome_bristol_type?.toString() || 'N/A',
            admin.outcome_recorded_at ? format(new Date(admin.outcome_recorded_at), 'yyyy-MM-dd HH:mm') : 'N/A',
            admin.notes || '',
          ]);
        });
      }

      const csvContent = rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `bowel-care-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const generatePDF = () => {
    if (!exportData) return;
    setExporting(true);

    try {
      const doc = new jsPDF();
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > 280) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Bowel Care Report', margin, yPos);
      yPos += 10;

      // Date range
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateRangeText = startDate && endDate
        ? `${format(startDate, 'PP')} - ${format(endDate, 'PP')}`
        : startDate
          ? `From ${format(startDate, 'PP')}`
          : endDate
            ? `Until ${format(endDate, 'PP')}`
            : 'All dates';
      doc.text(`Report Period: ${dateRangeText}`, margin, yPos);
      yPos += 5;
      doc.text(`Generated: ${format(new Date(), 'PPp')}`, margin, yPos);
      yPos += 5;
      doc.text(`Total Bowel Entries: ${exportData.logs.length}`, margin, yPos);
      yPos += 5;
      if (includePrn) {
        doc.text(`Total PRN Administrations: ${exportData.prnAdministrations.length}`, margin, yPos);
        yPos += 5;
      }
      yPos += 10;

      // Configuration Summary
      if (includeConfig && config) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Configuration Summary', margin, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`No BM Days Threshold: ${config.no_bm_days_threshold} days`, margin, yPos);
        yPos += 5;
        doc.text(`Consecutive Type 1 Threshold: ${config.type1_consecutive_days_threshold} days`, margin, yPos);
        yPos += 5;
        doc.text(`PRN Monitoring Window: ${config.monitor_hours_after_prn} hours`, margin, yPos);
        yPos += 5;
        doc.text(`Max PRN Doses per 24h: ${config.max_prn_doses_per_24h}`, margin, yPos);
        yPos += 5;
        doc.text(`Diarrhoea Threshold: ${config.diarrhoea_type67_count_threshold} Type 6/7 in ${config.diarrhoea_hours_window} hours`, margin, yPos);
        yPos += 15;
      }

      // Trend Summary
      if (includeTrends && exportData.logs.length > 0) {
        checkPageBreak(60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Trend Summary', margin, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        // Bristol type distribution
        const bristolCounts: Record<number, number> = {};
        exportData.logs.forEach(log => {
          bristolCounts[log.bristol_type] = (bristolCounts[log.bristol_type] || 0) + 1;
        });

        const actualBMs = exportData.logs.filter(l => l.bristol_type > 0);
        const noBMs = exportData.logs.filter(l => l.bristol_type === 0);

        doc.text(`Total Bowel Movements: ${actualBMs.length}`, margin, yPos);
        yPos += 5;
        doc.text(`"Bowel Not Opened" Entries: ${noBMs.length}`, margin, yPos);
        yPos += 5;

        // Type breakdown
        doc.text('Bristol Type Distribution:', margin, yPos);
        yPos += 5;
        Object.entries(bristolCounts)
          .sort(([a], [b]) => Number(a) - Number(b))
          .forEach(([type, count]) => {
            doc.text(`  Type ${type} (${getBristolLabel(Number(type))}): ${count}`, margin, yPos);
            yPos += 4;
          });

        // Indicator flags
        const withStraining = exportData.logs.filter(l => l.indicators?.straining).length;
        const withBlood = exportData.logs.filter(l => l.indicators?.blood && l.indicators.blood !== 'none').length;
        const withPain = exportData.logs.filter(l => l.indicators?.pain && l.indicators.pain !== 'none').length;

        yPos += 5;
        doc.text('Clinical Indicators:', margin, yPos);
        yPos += 5;
        doc.text(`  Entries with Straining: ${withStraining}`, margin, yPos);
        yPos += 4;
        doc.text(`  Entries with Blood: ${withBlood}`, margin, yPos);
        yPos += 4;
        doc.text(`  Entries with Pain: ${withPain}`, margin, yPos);
        yPos += 15;
      }

      // PRN Summary
      if (includePrn && exportData.prnAdministrations.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PRN Medication Summary', margin, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const successful = exportData.prnAdministrations.filter(p => p.bowel_motion_occurred === true).length;
        const unsuccessful = exportData.prnAdministrations.filter(p => p.bowel_motion_occurred === false).length;
        const pending = exportData.prnAdministrations.filter(p => p.bowel_motion_occurred === null).length;

        doc.text(`Administrations with bowel motion: ${successful}`, margin, yPos);
        yPos += 5;
        doc.text(`Administrations without bowel motion: ${unsuccessful}`, margin, yPos);
        yPos += 5;
        doc.text(`Outcome pending: ${pending}`, margin, yPos);
        yPos += 15;
      }

      // Bowel Log Details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      checkPageBreak(20);
      doc.text('Bowel Log Details', margin, yPos);
      yPos += 10;

      exportData.logs.forEach((log, index) => {
        checkPageBreak(45);

        const staffName = log.created_by ? exportData.profiles[log.created_by] || 'Unknown' : 'Unknown';
        const indicators = log.indicators || {};
        const eventTime = log.event_occurred_at || log.entry_time;
        const isOnBehalfOf = !!log.recorded_on_behalf_of_name;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Entry ${index + 1} - ${format(new Date(eventTime), 'PPp')}`, margin, yPos);
        yPos += 5;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // On Behalf Of attribution
        if (isOnBehalfOf) {
          doc.setFont('helvetica', 'italic');
          doc.text(`Recorded on behalf of: ${log.recorded_on_behalf_of_name}`, margin, yPos);
          yPos += 4;
          if (log.recorded_on_behalf_of_role) {
            doc.text(`  Role: ${getRoleLabel(log.recorded_on_behalf_of_role)}`, margin, yPos);
            yPos += 4;
          }
          if (log.recorded_on_behalf_of_reason) {
            doc.text(`  Reason: ${getReasonLabel(log.recorded_on_behalf_of_reason)}`, margin, yPos);
            yPos += 4;
          }
          doc.setFont('helvetica', 'normal');
          doc.text(`Recorded by: ${staffName}`, margin, yPos);
          yPos += 4;
        } else {
          doc.text(`Staff: ${staffName}`, margin, yPos);
          yPos += 4;
        }
        
        doc.text(`Bristol Type ${log.bristol_type}: ${getBristolLabel(log.bristol_type)}`, margin, yPos);
        yPos += 4;
        if (log.stool_size) {
          doc.text(`Size: ${getSizeLabel(log.stool_size)}`, margin, yPos);
          yPos += 4;
        }
        doc.text(`Status: ${log.observed_status}`, margin, yPos);
        yPos += 4;

        // Indicators on one line
        const indicatorsList: string[] = [];
        if (indicators.straining) indicatorsList.push('Straining');
        if (indicators.blood && indicators.blood !== 'none') indicatorsList.push(`Blood: ${indicators.blood}`);
        if (indicators.mucus) indicatorsList.push('Mucus');
        if (indicators.bloating) indicatorsList.push('Bloating');
        if (indicators.vomiting) indicatorsList.push('Vomiting');
        if (indicators.pain && indicators.pain !== 'none') indicatorsList.push(`Pain: ${indicators.pain}`);
        if (indicators.abdominal_pain && indicators.abdominal_pain !== 'none') indicatorsList.push(`Abdominal Pain: ${indicators.abdominal_pain}`);

        if (indicatorsList.length > 0) {
          doc.text(`Indicators: ${indicatorsList.join(', ')}`, margin, yPos);
          yPos += 4;
        }

        if (log.notes) {
          const notesLines = doc.splitTextToSize(`Notes: ${log.notes}`, contentWidth);
          doc.text(notesLines, margin, yPos);
          yPos += notesLines.length * 4;
        }

        yPos += 6;
      });

      // PRN Details
      if (includePrn && exportData.prnAdministrations.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PRN Administration Details', margin, yPos);
        yPos += 10;

        exportData.prnAdministrations.forEach((admin, index) => {
          checkPageBreak(30);

          const staffName = admin.created_by ? exportData.profiles[admin.created_by] || 'Unknown' : 'Unknown';

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`Administration ${index + 1} - ${format(new Date(admin.administration_time), 'PPp')}`, margin, yPos);
          yPos += 5;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Staff: ${staffName}`, margin, yPos);
          yPos += 4;
          doc.text(`Medication: ${admin.medication_name} - ${admin.dose_given}`, margin, yPos);
          yPos += 4;
          if (admin.prior_bristol_type !== null) {
            doc.text(`Prior Bristol Type: ${admin.prior_bristol_type}`, margin, yPos);
            yPos += 4;
          }
          const outcomeText = admin.bowel_motion_occurred === null
            ? 'Outcome Pending'
            : admin.bowel_motion_occurred
              ? `Bowel Motion Occurred (Type ${admin.outcome_bristol_type || 'N/A'})`
              : 'No Bowel Motion';
          doc.text(outcomeText, margin, yPos);
          yPos += 4;

          if (admin.notes) {
            const notesLines = doc.splitTextToSize(`Notes: ${admin.notes}`, contentWidth);
            doc.text(notesLines, margin, yPos);
            yPos += notesLines.length * 4;
          }

          yPos += 6;
        });
      }

      // Footer - Citation
      checkPageBreak(30);
      yPos += 10;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const citation = 'Bristol Stool Chart - Lewis SJ, Heaton KW. Stool Form Scale as a Useful Guide to Intestinal Transit Time. Scandinavian Journal of Gastroenterology, 1997;32(9):920-924.';
      const citationLines = doc.splitTextToSize(citation, contentWidth);
      doc.text(citationLines, margin, yPos);

      doc.save(`bowel-care-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Export Reports</h2>
          <p className="text-sm text-muted-foreground">
            Generate PDF or CSV reports for medical professionals, clinicians, and NDIS funding
          </p>
        </div>
      </div>

      {/* Quick Date Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date Range</CardTitle>
          <CardDescription>Select the period for your report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={datePreset === 'last7' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('last7')}
            >
              Last 7 Days
            </Button>
            <Button
              variant={datePreset === 'last30' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('last30')}
            >
              Last 30 Days
            </Button>
            <Button
              variant={datePreset === 'lastMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('lastMonth')}
            >
              Last Month
            </Button>
            <Button
              variant={datePreset === 'lastYear' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('lastYear')}
            >
              Last Year
            </Button>
            <Button
              variant={datePreset === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange('custom')}
            >
              Custom
            </Button>
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {filteredLogs.length} bowel {filteredLogs.length !== 1 ? 'entries' : 'entry'}
            {includePrn && ` and ${filteredPrn.length} PRN administration${filteredPrn.length !== 1 ? 's' : ''}`} in selected range
          </p>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Include in Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="include-config"
              checked={includeConfig}
              onCheckedChange={(checked) => setIncludeConfig(checked === true)}
            />
            <Label htmlFor="include-config" className="cursor-pointer">
              Configuration Summary (thresholds, monitoring windows)
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="include-trends"
              checked={includeTrends}
              onCheckedChange={(checked) => setIncludeTrends(checked === true)}
            />
            <Label htmlFor="include-trends" className="cursor-pointer">
              Trend Summary (Bristol type distribution, clinical indicators)
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="include-prn"
              checked={includePrn}
              onCheckedChange={(checked) => setIncludePrn(checked === true)}
            />
            <Label htmlFor="include-prn" className="cursor-pointer">
              PRN Medication Administrations & Outcomes
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Download Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Download Report</CardTitle>
          <CardDescription>
            Choose your preferred format
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={generatePDF}
            disabled={exporting || !exportData || filteredLogs.length === 0}
            className="flex-1"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={generateCSV}
            disabled={exporting || !exportData || filteredLogs.length === 0}
            className="flex-1"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Table className="w-4 h-4 mr-2" />
            )}
            Download CSV
          </Button>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Reports include staff attribution and are suitable for GP review, clinical audit, and NDIS plan reviews.
        </CardFooter>
      </Card>

      {/* Report Use Cases */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Report Use Cases</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Medical Review:</strong> Share bowel patterns and PRN effectiveness with GPs or specialists.</p>
          <p><strong>Clinical Audit:</strong> Document interventions and outcomes for governance compliance.</p>
          <p><strong>NDIS Funding:</strong> Evidence-based reporting for plan reviews and support needs assessment.</p>
          <p><strong>Care Team Handover:</strong> Comprehensive summary for shift changes or team transitions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
