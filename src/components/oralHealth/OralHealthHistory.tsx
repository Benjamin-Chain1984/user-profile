/**
 * Oral Health Assessment History
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOralHealthAssessments } from '@/hooks/useOralHealth';
import { format, parseISO } from 'date-fns';
import { CATEGORY_LABELS, type OralHealthCategory, type MouthAnnotation } from '@/types/oralHealth';
import { History, MapPin } from 'lucide-react';

interface Props {
  clientId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  healthy: 'bg-success/10 text-success',
  changes: 'bg-warning/10 text-warning',
  unhealthy: 'bg-destructive/10 text-destructive',
};

export function OralHealthHistory({ clientId }: Props) {
  const { assessments, isLoading } = useOralHealthAssessments(clientId);

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Assessment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assessments recorded yet.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {assessments.map((a) => {
              const annotations = (a.mouth_annotations || []) as MouthAnnotation[];
              return (
                <Card key={a.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{format(parseISO(a.created_at), 'dd MMM yyyy HH:mm')}</span>
                    <Badge className={STATUS_COLORS[a.overall_status] || ''}>
                      {a.overall_status.charAt(0).toUpperCase() + a.overall_status.slice(1)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    {(['lips', 'tongue', 'roof_of_mouth', 'gums', 'teeth', 'dentures', 'breath', 'cleanliness', 'dental_pain'] as OralHealthCategory[]).map(cat => {
                      const val = a[cat as keyof typeof a] as string | null;
                      if (!val) return null;
                      const pillClass = val === 'healthy' ? 'bg-success/10 text-success'
                        : val === 'changes' ? 'bg-warning/10 text-warning'
                        : val === 'unhealthy' ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted/40 text-muted-foreground';
                      return (
                        <div key={cat} className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${pillClass}`}>
                          <span className={`w-2 h-2 rounded-full ${val === 'healthy' ? 'bg-success' : val === 'changes' ? 'bg-warning' : val === 'unhealthy' ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                          <span>{CATEGORY_LABELS[cat]}</span>
                        </div>
                      );
                    })}
                  </div>
                  {a.action_taken && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Action:</strong> {a.action_taken.replace(/_/g, ' ')}
                    </p>
                  )}
                  {annotations.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
                      </span>
                      <div className="space-y-1 pl-4">
                        {annotations.map((ann, i) => (
                          <div key={i} className="text-xs rounded bg-muted/50 px-2 py-1.5">
                            <span className="font-medium">{ann.location}</span>
                            <span className="text-muted-foreground"> — {ann.issue_type}</span>
                            {ann.notes && <p className="text-muted-foreground mt-0.5">{ann.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
