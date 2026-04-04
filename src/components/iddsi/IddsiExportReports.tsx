/**
 * IDDSI Export Reports - Placeholder for data export functionality
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileDown, FileText } from 'lucide-react';

interface IddsiExportReportsProps {
  clientId?: string;
  onClose: () => void;
}

export function IddsiExportReports({ clientId, onClose }: IddsiExportReportsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Export IDDSI Data</h2>
          <p className="text-muted-foreground text-sm">
            Download observation history and reports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Export functionality coming soon. You will be able to download mealtime observation history, 
            positioning checks, and IDDSI compliance reports.
          </p>
          <Button variant="outline" disabled className="gap-2">
            <FileDown className="h-4 w-4" />
            Export Observations (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
