/**
 * HealthPreventionExportReports - Export functionality for Health Prevention module
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useHealthPrevention } from '@/hooks/useHealthPrevention';
import { useProfile } from '@/contexts/ProfileContext';
import { 
  CANCER_SCREENING_PROGRAMS, 
  VACCINATION_PROGRAMS,
} from '@/types/healthPrevention';
import { FileDown, FileText, Table2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export function HealthPreventionExportReports() {
  const { screeningRecords, vaccinationRecords, getEligibleScreenings, getVaccinationsWithStatus, config } = useHealthPrevention();
  const { profile } = useProfile();
  
  const [includeScreenings, setIncludeScreenings] = useState(true);
  const [includeVaccinations, setIncludeVaccinations] = useState(true);
  const [includeDueItems, setIncludeDueItems] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const getScreeningName = (type: string) => {
    return CANCER_SCREENING_PROGRAMS.find(p => p.id === type)?.name || type;
  };

  const getVaccinationName = (type: string) => {
    return VACCINATION_PROGRAMS.find(p => p.id === type)?.name || type;
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(18);
      doc.text('Health Prevention Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(12);
      doc.text(profile?.fullName || 'Individual', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Screening history
      if (includeScreenings && screeningRecords.length > 0) {
        doc.setFontSize(14);
        doc.text('Cancer Screening History', 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        screeningRecords.forEach((record) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          const name = getScreeningName(record.screeningType);
          const status = record.status.charAt(0).toUpperCase() + record.status.slice(1);
          const date = record.dateCompleted ? format(new Date(record.dateCompleted), 'dd MMM yyyy') : 'N/A';
          doc.text(`• ${name}: ${status} (${date})`, 14, yPos);
          yPos += 6;
          if (record.nextDueDate) {
            doc.text(`  Next due: ${format(new Date(record.nextDueDate), 'dd MMM yyyy')}`, 14, yPos);
            yPos += 6;
          }
        });
        yPos += 5;
      }

      // Vaccination history
      if (includeVaccinations && vaccinationRecords.length > 0) {
        doc.setFontSize(14);
        doc.text('Vaccination History', 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        vaccinationRecords.forEach((record) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          const name = getVaccinationName(record.vaccinationType);
          const status = record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ');
          const date = record.dateGiven ? format(new Date(record.dateGiven), 'dd MMM yyyy') : 'N/A';
          doc.text(`• ${name}: ${status} (${date})`, 14, yPos);
          yPos += 6;
          if (record.givenBy) {
            doc.text(`  Given by: ${record.givenBy}`, 14, yPos);
            yPos += 6;
          }
        });
        yPos += 5;
      }

      // Due/overdue items
      if (includeDueItems) {
        const screenings = getEligibleScreenings();
        const vaccinations = getVaccinationsWithStatus();
        
        const dueScreenings = screenings.filter(s => s.displayStatus === 'due' || s.displayStatus === 'overdue');
        const dueVaccinations = vaccinations.filter(v => v.displayStatus === 'due' || v.displayStatus === 'overdue' || v.displayStatus === 'not_recorded');

        if (dueScreenings.length > 0 || dueVaccinations.length > 0) {
          doc.setFontSize(14);
          doc.text('Due / Overdue Items', 14, yPos);
          yPos += 8;

          doc.setFontSize(10);
          dueScreenings.forEach((item) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            const statusLabel = item.displayStatus === 'overdue' ? 'OVERDUE' : 'Due';
            doc.text(`• ${item.program.name}: ${statusLabel}`, 14, yPos);
            yPos += 6;
          });
          
          dueVaccinations.forEach((item) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            const statusLabel = item.displayStatus === 'overdue' ? 'OVERDUE' : 
                               item.displayStatus === 'not_recorded' ? 'Not recorded' : 'Due';
            doc.text(`• ${item.program.name}: ${statusLabel}`, 14, yPos);
            yPos += 6;
          });
        }
      }

      // Footer disclaimer
      yPos += 10;
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(8);
      doc.text('This report supports preventive health planning only. Screening and vaccination', 14, yPos);
      yPos += 4;
      doc.text('decisions should be discussed with a GP or qualified health professional.', 14, yPos);

      doc.save(`health-prevention-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
    setIsExporting(false);
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      let csv = 'Type,Name,Status,Date,Location/Provider,Next Due,Notes\n';

      if (includeScreenings) {
        screeningRecords.forEach((record) => {
          const name = getScreeningName(record.screeningType);
          const date = record.dateCompleted || '';
          const nextDue = record.nextDueDate || '';
          csv += `Screening,"${name}",${record.status},${date},"${record.location || ''}",${nextDue},"${record.notes || ''}"\n`;
        });
      }

      if (includeVaccinations) {
        vaccinationRecords.forEach((record) => {
          const name = getVaccinationName(record.vaccinationType);
          const date = record.dateGiven || '';
          const nextDue = record.nextDueDate || '';
          csv += `Vaccination,"${name}",${record.status},${date},"${record.givenBy || ''}",${nextDue},"${record.notes || ''}"\n`;
        });
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-prevention-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Reports
          </CardTitle>
          <CardDescription>
            Export health prevention records for GP visits, care planning, or NDIS evidence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Options */}
          <div className="space-y-4">
            <Label>Include in export:</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeScreenings"
                checked={includeScreenings}
                onCheckedChange={(v) => setIncludeScreenings(!!v)}
              />
              <Label htmlFor="includeScreenings" className="font-normal">
                Cancer screening history
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeVaccinations"
                checked={includeVaccinations}
                onCheckedChange={(v) => setIncludeVaccinations(!!v)}
              />
              <Label htmlFor="includeVaccinations" className="font-normal">
                Vaccination history
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDueItems"
                checked={includeDueItems}
                onCheckedChange={(v) => setIncludeDueItems(!!v)}
              />
              <Label htmlFor="includeDueItems" className="font-normal">
                Due / overdue items summary
              </Label>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportToPDF} disabled={isExporting} className="gap-2">
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Export PDF
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={isExporting} className="gap-2">
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Table2 className="h-4 w-4" />
              )}
              Export CSV
            </Button>
          </div>

          {/* Use cases */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Use cases:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• GP visits - share preventive health status</li>
              <li>• Care planning - document health prevention activities</li>
              <li>• NDIS evidence - demonstrate health management</li>
              <li>• Family updates - keep stakeholders informed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
