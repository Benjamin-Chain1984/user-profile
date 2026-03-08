/**
 * HealthMonitoringExportReports - CSV/JSON export with audit trail
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileDown, Calendar as CalendarIcon, FileJson, FileSpreadsheet } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useVitalSignEntries, useVitalSignConfig } from '@/hooks/useHealthMonitoring';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface HealthMonitoringExportReportsProps {
  clientId?: string;
  onClose?: () => void;
}

type DatePreset = 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export function HealthMonitoringExportReports({ clientId, onClose }: HealthMonitoringExportReportsProps) {
  const { toast } = useToast();
  const { entries } = useVitalSignEntries(clientId, 1000);
  const { config } = useVitalSignConfig(clientId);

  const [datePreset, setDatePreset] = useState<DatePreset>('last30');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  
  const [includeConfig, setIncludeConfig] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [includeAudit, setIncludeAudit] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);

  // Handle date preset changes
  const handlePresetChange = (preset: DatePreset) => {
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
      case 'thisMonth':
        setStartDate(startOfMonth(now));
        setEndDate(now);
        break;
      case 'lastMonth':
        setStartDate(startOfMonth(subMonths(now, 1)));
        setEndDate(endOfMonth(subMonths(now, 1)));
        break;
      case 'thisYear':
        setStartDate(startOfYear(now));
        setEndDate(now);
        break;
      case 'custom':
        break;
    }
  };

  // Filter entries by date range
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.event_occurred_at);
    return entryDate >= startDate && entryDate <= endDate;
  });

  // Generate CSV content
  const generateCSV = () => {
    const headers = [
      'Date/Time',
      'Temperature (°C)',
      'Temperature Status',
      'BP Systolic (mmHg)',
      'BP Diastolic (mmHg)',
      'BP Status',
      'SpO₂ (%)',
      'SpO₂ Status',
      'Heart Rate (bpm)',
      'HR Status',
      'Respiratory Rate (/min)',
      'RR Status',
      'Overall Status',
      ...(includeSymptoms ? ['Symptoms'] : []),
      'Notes',
      ...(includeAudit ? ['Created At', 'Created By', 'Edited At', 'Edit Reason', 'On Behalf Of'] : []),
    ];

    const rows = filteredEntries.map(entry => [
      format(new Date(entry.event_occurred_at), 'yyyy-MM-dd HH:mm'),
      entry.temperature_celsius ?? '',
      entry.temperature_status ?? '',
      entry.bp_systolic ?? '',
      entry.bp_diastolic ?? '',
      entry.bp_status ?? '',
      entry.oxygen_saturation ?? '',
      entry.oxygen_status ?? '',
      entry.heart_rate ?? '',
      entry.heart_rate_status ?? '',
      entry.respiratory_rate ?? '',
      entry.respiratory_status ?? '',
      entry.overall_status ?? '',
      ...(includeSymptoms ? [(entry.symptoms || []).join('; ')] : []),
      entry.notes ?? '',
      ...(includeAudit ? [
        format(new Date(entry.created_at), 'yyyy-MM-dd HH:mm'),
        entry.created_by ?? '',
        entry.edited_at ? format(new Date(entry.edited_at), 'yyyy-MM-dd HH:mm') : '',
        entry.edit_reason ?? '',
        entry.recorded_on_behalf_of_name ? `${entry.recorded_on_behalf_of_name} (${entry.recorded_on_behalf_of_role})` : '',
      ] : []),
    ]);

    // Add config summary if included
    let configSection = '';
    if (includeConfig) {
      configSection = '\n\n--- CONFIGURATION SUMMARY ---\n';
      configSection += `Temperature Monitoring: ${config.temperature_enabled ? 'Enabled' : 'Disabled'}\n`;
      configSection += `Blood Pressure Monitoring: ${config.bp_enabled ? 'Enabled' : 'Disabled'}\n`;
      configSection += `SpO₂ Monitoring: ${config.oxygen_enabled ? 'Enabled' : 'Disabled'}\n`;
      configSection += `Heart Rate Monitoring: ${config.heart_rate_enabled ? 'Enabled' : 'Disabled'}\n`;
      configSection += `Respiratory Rate Monitoring: ${config.respiratory_enabled ? 'Enabled' : 'Disabled'}\n`;
      configSection += `Amber Recheck Time: ${config.amber_recheck_hours} hours\n`;
    }

    // Add trend summary if included
    let trendSection = '';
    if (includeTrends && filteredEntries.length > 0) {
      const temps = filteredEntries.filter(e => e.temperature_celsius).map(e => e.temperature_celsius!);
      const bps = filteredEntries.filter(e => e.bp_systolic).map(e => e.bp_systolic!);
      const o2s = filteredEntries.filter(e => e.oxygen_saturation).map(e => e.oxygen_saturation!);
      
      trendSection = '\n\n--- TREND SUMMARY ---\n';
      trendSection += `Report Period: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}\n`;
      trendSection += `Total Entries: ${filteredEntries.length}\n`;
      
      if (temps.length > 0) {
        trendSection += `Temperature - Min: ${Math.min(...temps).toFixed(1)}°C, Max: ${Math.max(...temps).toFixed(1)}°C, Avg: ${(temps.reduce((a,b) => a+b, 0) / temps.length).toFixed(1)}°C\n`;
      }
      if (bps.length > 0) {
        trendSection += `Systolic BP - Min: ${Math.min(...bps)} mmHg, Max: ${Math.max(...bps)} mmHg, Avg: ${Math.round(bps.reduce((a,b) => a+b, 0) / bps.length)} mmHg\n`;
      }
      if (o2s.length > 0) {
        trendSection += `SpO₂ - Min: ${Math.min(...o2s)}%, Max: ${Math.max(...o2s)}%, Avg: ${Math.round(o2s.reduce((a,b) => a+b, 0) / o2s.length)}%\n`;
      }
      
      const redCount = filteredEntries.filter(e => e.overall_status === 'red').length;
      const amberCount = filteredEntries.filter(e => e.overall_status === 'amber').length;
      const idealCount = filteredEntries.filter(e => e.overall_status === 'ideal').length;
      trendSection += `Status Distribution - IDEAL: ${idealCount}, AMBER: ${amberCount}, RED: ${redCount}\n`;
    }

    const csvContent = headers.join(',') + '\n' + 
      rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n') +
      configSection + trendSection;

    return csvContent;
  };

  // Generate JSON content
  const generateJSON = () => {
    const data: Record<string, unknown> = {
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        totalEntries: filteredEntries.length,
      },
      entries: filteredEntries.map(entry => ({
        eventOccurredAt: entry.event_occurred_at,
        vitals: {
          temperature: entry.temperature_celsius,
          temperatureStatus: entry.temperature_status,
          bpSystolic: entry.bp_systolic,
          bpDiastolic: entry.bp_diastolic,
          bpStatus: entry.bp_status,
          oxygenSaturation: entry.oxygen_saturation,
          oxygenStatus: entry.oxygen_status,
          heartRate: entry.heart_rate,
          heartRateStatus: entry.heart_rate_status,
          respiratoryRate: entry.respiratory_rate,
          respiratoryStatus: entry.respiratory_status,
        },
        overallStatus: entry.overall_status,
        ...(includeSymptoms ? { symptoms: entry.symptoms } : {}),
        notes: entry.notes,
        ...(includeAudit ? {
          audit: {
            createdAt: entry.created_at,
            createdBy: entry.created_by,
            editedAt: entry.edited_at,
            editedBy: entry.edited_by,
            editReason: entry.edit_reason,
            onBehalfOf: entry.recorded_on_behalf_of_name ? {
              name: entry.recorded_on_behalf_of_name,
              role: entry.recorded_on_behalf_of_role,
              reason: entry.recorded_on_behalf_of_reason,
            } : null,
          },
        } : {}),
      })),
    };

    if (includeConfig) {
      data.configuration = {
        temperatureEnabled: config.temperature_enabled,
        bpEnabled: config.bp_enabled,
        oxygenEnabled: config.oxygen_enabled,
        heartRateEnabled: config.heart_rate_enabled,
        respiratoryEnabled: config.respiratory_enabled,
        amberRecheckHours: config.amber_recheck_hours,
      };
    }

    if (includeTrends && filteredEntries.length > 0) {
      const temps = filteredEntries.filter(e => e.temperature_celsius).map(e => e.temperature_celsius!);
      const bps = filteredEntries.filter(e => e.bp_systolic).map(e => e.bp_systolic!);

      data.trendSummary = {
        temperature: temps.length > 0 ? {
          min: Math.min(...temps),
          max: Math.max(...temps),
          avg: temps.reduce((a,b) => a+b, 0) / temps.length,
        } : null,
        systolicBp: bps.length > 0 ? {
          min: Math.min(...bps),
          max: Math.max(...bps),
          avg: bps.reduce((a,b) => a+b, 0) / bps.length,
        } : null,
        statusDistribution: {
          ideal: filteredEntries.filter(e => e.overall_status === 'ideal').length,
          amber: filteredEntries.filter(e => e.overall_status === 'amber').length,
          red: filteredEntries.filter(e => e.overall_status === 'red').length,
        },
      };
    }

    return JSON.stringify(data, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = generateCSV();
    const filename = `health-monitoring-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`;
    downloadFile(csv, filename, 'text/csv');
    toast({ title: 'Export Complete', description: `Downloaded ${filename}` });
  };

  const handleExportJSON = () => {
    const json = generateJSON();
    const filename = `health-monitoring-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.json`;
    downloadFile(json, filename, 'application/json');
    toast({ title: 'Export Complete', description: `Downloaded ${filename}` });
  };

  return (
    <div className="space-y-6">
      {onClose && (
        <Button variant="ghost" onClick={onClose} className="gap-2">
          ← Back to Health Monitoring
        </Button>
      )}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileDown className="h-5 w-5" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="space-y-3">
          <Label>Date Range</Label>
          <Select value={datePreset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {datePreset === 'custom' && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(startDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="self-center">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(endDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {filteredEntries.length} entries in selected range
          </p>
        </div>

        {/* Include Options */}
        <div className="space-y-3">
          <Label>Include in Report</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={includeConfig} onCheckedChange={(c) => setIncludeConfig(!!c)} />
              <span className="text-sm">Configuration Summary</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={includeTrends} onCheckedChange={(c) => setIncludeTrends(!!c)} />
              <span className="text-sm">Trend Statistics</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={includeSymptoms} onCheckedChange={(c) => setIncludeSymptoms(!!c)} />
              <span className="text-sm">Associated Symptoms</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={includeAudit} onCheckedChange={(c) => setIncludeAudit(!!c)} />
              <span className="text-sm">Audit Trail (staff attribution, edits)</span>
            </label>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleExportCSV} disabled={filteredEntries.length === 0} className="flex-1">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportJSON} disabled={filteredEntries.length === 0} variant="outline" className="flex-1">
            <FileJson className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>

        {/* Clinical Citation */}
        <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
          <p className="font-medium">Report Standards</p>
          <p>
            Reports include clinical observations and comply with NDIS documentation requirements.
            All entries include staff attribution and audit information for compliance reviews.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
