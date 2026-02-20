import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AbbeyPainAssessment, getSeverityLabel, getSeverityColor, getSeverityBgColor, getSeverityDotColor } from '@/types/painAssessment';
import { AlertCircle, TrendingUp, TrendingDown, Minus, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

interface PainQuickStatusProps {
  latestAssessment: AbbeyPainAssessment | null;
  trendDirection: 'improving' | 'worsening' | 'stable';
  loading: boolean;
  onStartAssessment: () => void;
}

export function PainQuickStatus({ latestAssessment, trendDirection, loading, onStartAssessment }: PainQuickStatusProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 h-24 bg-muted" />
      </Card>
    );
  }

  if (!latestAssessment) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No assessments recorded yet</p>
          <Button onClick={onStartAssessment} variant="outline" className="mt-4">
            Start First Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trendDirection === 'improving' ? TrendingDown : 
                    trendDirection === 'worsening' ? TrendingUp : Minus;
  
  const trendColor = trendDirection === 'improving' ? 'text-success' :
                     trendDirection === 'worsening' ? 'text-destructive' : 'text-muted-foreground';
  
  const trendLabel = trendDirection === 'improving' ? 'Improving' :
                     trendDirection === 'worsening' ? 'Worsening' : 'Stable';

  return (
    <Card className={`${getSeverityBgColor(latestAssessment.severity)} border-none`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Pain Level</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-4 h-4 rounded-full ${getSeverityDotColor(latestAssessment.severity)}`} />
              <p className={`text-2xl sm:text-3xl font-bold ${getSeverityColor(latestAssessment.severity)}`}>
                {getSeverityLabel(latestAssessment.severity)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(latestAssessment.created_at), 'PPp')}
            </p>
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{trendLabel}</span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${getSeverityBgColor(latestAssessment.severity)}`}>
            <AlertCircle className={`w-8 h-8 ${getSeverityColor(latestAssessment.severity)}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
