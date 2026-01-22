import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { usePainConfig } from '@/hooks/usePainConfig';
import { 
  AbbeyPainAssessment, 
  PainActionRecord, 
  getSeverityLabel, 
  getPainTypeLabel,
  ASSESSMENT_TRIGGER_LABELS,
  AssessmentTrigger,
  ABBEY_QUESTIONS
} from '@/types/painAssessment';
import { format, isWithinInterval, startOfDay, endOfDay, subDays, subMonths, subYears } from 'date-fns';
import { CalendarIcon, FileDown, FileText, Table, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface PainExportReportsProps {
  assessments: AbbeyPainAssessment[];
  onClose: () => void;
}

interface ExportData {
  assessments: AbbeyPainAssessment[];
  actions: Record<string, PainActionRecord[]>;
  profiles: Record<string, string>;
}

type DateRangePreset = 'last7' | 'last30' | 'lastMonth' | 'lastYear' | 'custom';

export function PainExportReports({ assessments, onClose }: PainExportReportsProps) {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last7');
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [includeConfig, setIncludeConfig] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  
  const { getEffectiveConfig } = usePainConfig();
  const config = getEffectiveConfig();

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

  // Filter assessments by date range
  const filteredAssessments = assessments.filter(assessment => {
    const assessmentDate = new Date(assessment.created_at);
    if (startDate && endDate) {
      return isWithinInterval(assessmentDate, {
        start: startOfDay(startDate),
        end: endOfDay(endDate),
      });
    }
    if (startDate) {
      return assessmentDate >= startOfDay(startDate);
    }
    if (endDate) {
      return assessmentDate <= endOfDay(endDate);
    }
    return true;
  });

  // Fetch additional data for export
  useEffect(() => {
    async function fetchExportData() {
      if (filteredAssessments.length === 0) {
        setExportData({ assessments: [], actions: {}, profiles: {} });
        return;
      }

      try {
        const assessmentIds = filteredAssessments.map(a => a.id);
        const creatorIds = [...new Set(filteredAssessments.map(a => a.created_by).filter(Boolean))];

        // Fetch actions
        const { data: actions } = await supabase
          .from('pain_action_records')
          .select('*')
          .in('assessment_id', assessmentIds);

        const actionsMap: Record<string, PainActionRecord[]> = {};
        (actions || []).forEach((action) => {
          if (!actionsMap[action.assessment_id]) {
            actionsMap[action.assessment_id] = [];
          }
          actionsMap[action.assessment_id].push(action as PainActionRecord);
        });

        // Fetch profiles
        let profilesMap: Record<string, string> = {};
        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', creatorIds);

          (profiles || []).forEach((p) => {
            profilesMap[p.id] = p.full_name || 'Unknown';
          });
        }

        setExportData({
          assessments: filteredAssessments,
          actions: actionsMap,
          profiles: profilesMap,
        });
      } catch (err) {
        console.error('Error fetching export data:', err);
      }
    }

    fetchExportData();
  }, [filteredAssessments]);

  const generateCSV = () => {
    if (!exportData) return;
    
    setExporting(true);

    try {
      const rows: string[][] = [];
      
      // Header
      rows.push([
        'Date/Time',
        'Staff Member',
        'Total Score',
        'Severity',
        'Pain Type',
        'Trigger Reason',
        'Q1 Vocalisation',
        'Q2 Facial Expression',
        'Q3 Body Language',
        'Q4 Behavioural Change',
        'Q5 Physiological Change',
        'Q6 Physical Changes',
        'Notes',
        'Actions Taken',
      ]);

      // Data rows
      exportData.assessments.forEach(assessment => {
        const actions = exportData.actions[assessment.id] || [];
        const actionsText = actions.map(a => a.action_taken).join('; ');
        const staffName = assessment.created_by ? exportData.profiles[assessment.created_by] || 'Unknown' : 'Unknown';
        const triggerLabel = assessment.trigger_reason 
          ? ASSESSMENT_TRIGGER_LABELS[assessment.trigger_reason as AssessmentTrigger] || assessment.trigger_reason
          : '';

        rows.push([
          format(new Date(assessment.created_at), 'yyyy-MM-dd HH:mm'),
          staffName,
          assessment.total_score.toString(),
          getSeverityLabel(assessment.severity),
          getPainTypeLabel(assessment.pain_type),
          triggerLabel,
          assessment.q1_vocalization.toString(),
          assessment.q2_facial_expression.toString(),
          assessment.q3_body_language.toString(),
          assessment.q4_behavioral_change.toString(),
          assessment.q5_physiological_change.toString(),
          assessment.q6_physical_change.toString(),
          assessment.notes || '',
          actionsText,
        ]);
      });

      // Convert to CSV string
      const csvContent = rows.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `abbey-pain-scale-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > 280) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Abbey Pain Scale Report', margin, yPos);
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
      doc.text(`Total Assessments: ${exportData.assessments.length}`, margin, yPos);
      yPos += 15;

      // Configuration Summary
      if (includeConfig) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Configuration Summary', margin, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const triggers = config.assessment_triggers.map(t => 
          ASSESSMENT_TRIGGER_LABELS[t as AssessmentTrigger] || t
        ).join(', ');
        doc.text(`Assessment Triggers: ${triggers}`, margin, yPos);
        yPos += 5;
        doc.text(`Mild Pain Reassessment: ${config.mild_reassess_hours} hours`, margin, yPos);
        yPos += 5;
        doc.text(`Moderate Pain Reassessment: ${config.moderate_reassess_hours} hours`, margin, yPos);
        yPos += 5;
        doc.text(`Severe Pain Reassessment: ${config.severe_reassess_hours} hours`, margin, yPos);
        yPos += 15;
      }

      // Trend Summary
      if (includeTrends && exportData.assessments.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Trend Summary', margin, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const scores = exportData.assessments.map(a => a.total_score);
        const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        
        const severityCounts = {
          no_pain: exportData.assessments.filter(a => a.severity === 'no_pain').length,
          mild: exportData.assessments.filter(a => a.severity === 'mild').length,
          moderate: exportData.assessments.filter(a => a.severity === 'moderate').length,
          severe: exportData.assessments.filter(a => a.severity === 'severe').length,
        };

        doc.text(`Average Score: ${avgScore}/18`, margin, yPos);
        yPos += 5;
        doc.text(`Highest Score: ${maxScore}/18`, margin, yPos);
        yPos += 5;
        doc.text(`Lowest Score: ${minScore}/18`, margin, yPos);
        yPos += 5;
        doc.text(`No Pain Assessments: ${severityCounts.no_pain}`, margin, yPos);
        yPos += 5;
        doc.text(`Mild Pain Assessments: ${severityCounts.mild}`, margin, yPos);
        yPos += 5;
        doc.text(`Moderate Pain Assessments: ${severityCounts.moderate}`, margin, yPos);
        yPos += 5;
        doc.text(`Severe Pain Assessments: ${severityCounts.severe}`, margin, yPos);
        yPos += 15;
      }

      // Assessment Details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      checkPageBreak(20);
      doc.text('Assessment Details', margin, yPos);
      yPos += 10;

      exportData.assessments.forEach((assessment, index) => {
        checkPageBreak(60);
        
        const staffName = assessment.created_by ? exportData.profiles[assessment.created_by] || 'Unknown' : 'Unknown';
        const actions = exportData.actions[assessment.id] || [];

        // Assessment header
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Assessment ${index + 1} - ${format(new Date(assessment.created_at), 'PPp')}`, margin, yPos);
        yPos += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Staff: ${staffName}`, margin, yPos);
        yPos += 4;
        doc.text(`Score: ${assessment.total_score}/18 - ${getSeverityLabel(assessment.severity)}`, margin, yPos);
        yPos += 4;
        doc.text(`Pain Type: ${getPainTypeLabel(assessment.pain_type)}`, margin, yPos);
        yPos += 4;

        if (assessment.trigger_reason) {
          const triggerLabel = ASSESSMENT_TRIGGER_LABELS[assessment.trigger_reason as AssessmentTrigger] || assessment.trigger_reason;
          doc.text(`Trigger: ${triggerLabel}`, margin, yPos);
          yPos += 4;
        }

        // Question scores
        doc.text(`Q1 Vocalisation: ${assessment.q1_vocalization}/3`, margin, yPos);
        doc.text(`Q2 Facial: ${assessment.q2_facial_expression}/3`, margin + 50, yPos);
        doc.text(`Q3 Body Language: ${assessment.q3_body_language}/3`, margin + 100, yPos);
        yPos += 4;
        doc.text(`Q4 Behavioural: ${assessment.q4_behavioral_change}/3`, margin, yPos);
        doc.text(`Q5 Physiological: ${assessment.q5_physiological_change}/3`, margin + 50, yPos);
        doc.text(`Q6 Physical: ${assessment.q6_physical_change}/3`, margin + 100, yPos);
        yPos += 4;

        if (assessment.notes) {
          const notesLines = doc.splitTextToSize(`Notes: ${assessment.notes}`, contentWidth);
          doc.text(notesLines, margin, yPos);
          yPos += notesLines.length * 4;
        }

        // Actions
        if (includeActions && actions.length > 0) {
          doc.setFont('helvetica', 'italic');
          doc.text('Actions Taken:', margin, yPos);
          yPos += 4;
          doc.setFont('helvetica', 'normal');
          actions.forEach(action => {
            const actionLines = doc.splitTextToSize(`• ${action.action_taken}`, contentWidth - 5);
            doc.text(actionLines, margin + 5, yPos);
            yPos += actionLines.length * 4;
            if (action.outcome) {
              const outcomeLines = doc.splitTextToSize(`  Outcome: ${action.outcome}`, contentWidth - 10);
              doc.text(outcomeLines, margin + 10, yPos);
              yPos += outcomeLines.length * 4;
            }
          });
        }

        yPos += 8;
      });

      // Footer - Citation
      checkPageBreak(30);
      yPos += 10;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const citation = 'Abbey Pain Scale – Abbey, J., Piller, N., De Bellis, A., Esterman, A., Parker, D., Giles, L., & Lowcay, B. (2004). The Abbey pain scale: a 1-minute numerical indicator for people with end-stage dementia. International Journal of Palliative Nursing, 10(1), 6–13.';
      const citationLines = doc.splitTextToSize(citation, contentWidth);
      doc.text(citationLines, margin, yPos);

      // Save
      doc.save(`abbey-pain-scale-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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

      {/* Date Range Selection */}
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
            {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''} in selected range
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
            <Label htmlFor="include-config" className="cursor-pointer">Configuration summary</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="include-trends"
              checked={includeTrends}
              onCheckedChange={(checked) => setIncludeTrends(checked === true)}
            />
            <Label htmlFor="include-trends" className="cursor-pointer">Trend summary and statistics</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="include-actions"
              checked={includeActions}
              onCheckedChange={(checked) => setIncludeActions(checked === true)}
            />
            <Label htmlFor="include-actions" className="cursor-pointer">Actions taken for each assessment</Label>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Download Report</CardTitle>
          <CardDescription>Choose your preferred format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={generatePDF} 
              disabled={exporting || filteredAssessments.length === 0}
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
              disabled={exporting || filteredAssessments.length === 0}
              className="flex-1"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Table className="w-4 h-4 mr-2" />
              )}
              Download CSV
            </Button>
          </div>
          {filteredAssessments.length === 0 && (
            <p className="text-sm text-warning mt-3">No assessments found in the selected date range.</p>
          )}
        </CardContent>
      </Card>

      {/* Report Use Cases */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Reports are designed for:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• GP reviews and medical consultations</li>
            <li>• Behaviour support plan reviews</li>
            <li>• Safeguarding and clinical governance</li>
            <li>• NDIS evidence and reporting</li>
            <li>• Shift handovers and team communication</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
