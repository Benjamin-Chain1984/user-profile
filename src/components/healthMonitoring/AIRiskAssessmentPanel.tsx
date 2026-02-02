/**
 * AIRiskAssessmentPanel - AI-powered trend detection and risk assessment
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Activity,
  Thermometer,
  Heart,
  Wind,
  Gauge
} from 'lucide-react';
import { useVitalSignEntries } from '@/hooks/useHealthMonitoring';
import type { VitalType, VitalStatus, VitalSignEntry } from '@/types/healthMonitoring';
import { VITAL_THRESHOLDS } from '@/types/healthMonitoring';

interface AIRiskAssessmentPanelProps {
  clientId?: string;
}

interface RiskInsight {
  id: string;
  type: 'critical' | 'warning' | 'positive' | 'info';
  title: string;
  description: string;
  vitalTypes: VitalType[];
  confidence: number;
  recommendation?: string;
}

export function AIRiskAssessmentPanel({ clientId }: AIRiskAssessmentPanelProps) {
  const { entries } = useVitalSignEntries(clientId, 50);

  // Calculate risk score and insights
  const { riskScore, riskLevel, insights } = useMemo(() => {
    if (entries.length === 0) {
      return { riskScore: 0, riskLevel: 'unknown' as const, insights: [] };
    }

    const results: RiskInsight[] = [];
    let score = 0;

    // Recent entries (last 5)
    const recent = entries.slice(0, 5);
    const older = entries.slice(5, 15);

    // 1. Check for RED status in recent entries
    const recentRedCount = recent.filter(e => e.overall_status === 'red').length;
    if (recentRedCount > 0) {
      score += 30 * recentRedCount;
      results.push({
        id: 'red-status',
        type: 'critical',
        title: 'Critical Readings Detected',
        description: `${recentRedCount} recent vital sign reading(s) in the RED zone require immediate attention.`,
        vitalTypes: recent.filter(e => e.overall_status === 'red').flatMap(e => {
          const types: VitalType[] = [];
          if (e.temperature_status === 'red') types.push('temperature');
          if (e.bp_status === 'red') types.push('bp_systolic');
          if (e.oxygen_status === 'red') types.push('oxygen');
          if (e.heart_rate_status === 'red') types.push('heart_rate');
          if (e.respiratory_status === 'red') types.push('respiratory');
          return types;
        }),
        confidence: 100,
        recommendation: 'Call 000 immediately if situation is life-threatening.',
      });
    }

    // 2. Check for AMBER trend
    const recentAmberCount = recent.filter(e => e.overall_status === 'amber').length;
    if (recentAmberCount >= 2) {
      score += 15 * recentAmberCount;
      results.push({
        id: 'amber-trend',
        type: 'warning',
        title: 'Elevated Readings Pattern',
        description: `${recentAmberCount} of the last 5 readings are in the AMBER zone.`,
        vitalTypes: [],
        confidence: 85,
        recommendation: 'Increase observation frequency and monitor closely.',
      });
    }

    // 3. Temperature trend analysis
    const recentTemps = recent.filter(e => e.temperature_celsius).map(e => e.temperature_celsius!);
    const olderTemps = older.filter(e => e.temperature_celsius).map(e => e.temperature_celsius!);
    if (recentTemps.length >= 2 && olderTemps.length >= 2) {
      const recentAvg = recentTemps.reduce((a, b) => a + b, 0) / recentTemps.length;
      const olderAvg = olderTemps.reduce((a, b) => a + b, 0) / olderTemps.length;
      
      if (recentAvg > olderAvg + 0.3) {
        score += 20;
        results.push({
          id: 'temp-rising',
          type: 'warning',
          title: 'Temperature Rising Trend',
          description: `Temperature has increased by ${(recentAvg - olderAvg).toFixed(1)}°C on average over recent readings. Possible infection risk.`,
          vitalTypes: ['temperature'],
          confidence: 78,
          recommendation: 'Monitor for signs of infection. Seek medical advice if trend continues.',
        });
      }
    }

    // 4. Blood Pressure analysis
    const recentBP = recent.filter(e => e.bp_systolic).map(e => ({ s: e.bp_systolic!, d: e.bp_diastolic! }));
    if (recentBP.length >= 3) {
      const avgSystolic = recentBP.reduce((a, b) => a + b.s, 0) / recentBP.length;
      
      // Sudden drop detection
      if (recentBP.length >= 2 && recentBP[0].s < recentBP[1].s - 20) {
        score += 25;
        results.push({
          id: 'bp-drop',
          type: 'warning',
          title: 'Sudden Blood Pressure Drop',
          description: `Blood pressure dropped by ${recentBP[1].s - recentBP[0].s} mmHg. Monitor for dizziness and falls risk.`,
          vitalTypes: ['bp_systolic'],
          confidence: 82,
          recommendation: 'Ensure safe positioning. Monitor for dizziness, confusion, or fainting.',
        });
      }

      // Consistently high
      if (avgSystolic > 150) {
        score += 20;
        results.push({
          id: 'bp-high',
          type: 'warning',
          title: 'Elevated Blood Pressure',
          description: `Average systolic pressure is ${avgSystolic.toFixed(0)} mmHg over recent readings.`,
          vitalTypes: ['bp_systolic'],
          confidence: 88,
          recommendation: 'Review with healthcare provider if pattern persists.',
        });
      }
    }

    // 5. Oxygen saturation analysis
    const recentO2 = recent.filter(e => e.oxygen_saturation).map(e => e.oxygen_saturation!);
    if (recentO2.length >= 2) {
      const lowO2Count = recentO2.filter(v => v < 94).length;
      if (lowO2Count >= 2) {
        score += 30;
        results.push({
          id: 'o2-low',
          type: 'critical',
          title: 'Repeated Low Oxygen Episodes',
          description: `${lowO2Count} readings below 94% SpO₂. Assess breathing and escalate.`,
          vitalTypes: ['oxygen'],
          confidence: 92,
          recommendation: 'Check breathing, positioning. Consider medical review.',
        });
      }
    }

    // 6. Multi-parameter deterioration (rising RR + falling SpO2 + HR increase)
    if (recent.length >= 2) {
      const latest = recent[0];
      const previous = recent[1];
      
      const rrRising = (latest.respiratory_rate && previous.respiratory_rate) && 
                       latest.respiratory_rate > previous.respiratory_rate + 3;
      const o2Falling = (latest.oxygen_saturation && previous.oxygen_saturation) && 
                        latest.oxygen_saturation < previous.oxygen_saturation - 2;
      const hrRising = (latest.heart_rate && previous.heart_rate) && 
                       latest.heart_rate > previous.heart_rate + 10;

      if ((rrRising && o2Falling) || (rrRising && hrRising) || (o2Falling && hrRising)) {
        score += 35;
        results.push({
          id: 'multi-param',
          type: 'critical',
          title: 'Multi-Parameter Deterioration',
          description: 'Multiple vital signs showing concerning changes simultaneously. This pattern may indicate overall health decline.',
          vitalTypes: ['respiratory', 'oxygen', 'heart_rate'],
          confidence: 75,
          recommendation: 'Prompt medical review recommended. Increase observation frequency.',
        });
      }
    }

    // 7. Positive insight - consistent ideal readings
    const idealCount = recent.filter(e => e.overall_status === 'ideal').length;
    if (idealCount >= 4) {
      results.push({
        id: 'stable',
        type: 'positive',
        title: 'Vital Signs Stable',
        description: 'Recent readings are consistently within normal ranges.',
        vitalTypes: [],
        confidence: 95,
      });
    }

    // Calculate risk level
    const clampedScore = Math.min(100, Math.max(0, score));
    let level: 'low' | 'moderate' | 'high' | 'critical' | 'unknown';
    if (clampedScore >= 60) level = 'critical';
    else if (clampedScore >= 40) level = 'high';
    else if (clampedScore >= 20) level = 'moderate';
    else level = 'low';

    return { riskScore: clampedScore, riskLevel: level, insights: results };
  }, [entries]);

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'moderate': return 'text-amber-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBgColor = () => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'moderate': return 'bg-amber-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getInsightIcon = (type: RiskInsight['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightBg = (type: RiskInsight['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'positive': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getVitalIcon = (vitalType: VitalType) => {
    switch (vitalType) {
      case 'temperature': return <Thermometer className="h-3 w-3" />;
      case 'bp_systolic': 
      case 'bp_diastolic': return <Heart className="h-3 w-3" />;
      case 'oxygen': return <Gauge className="h-3 w-3" />;
      case 'heart_rate': return <Activity className="h-3 w-3" />;
      case 'respiratory': return <Wind className="h-3 w-3" />;
    }
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Not enough data for risk assessment. Log vital signs to enable AI analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Risk Assessment
          </CardTitle>
          <Badge className={cn('text-xs', getRiskBgColor(), 'text-white')}>
            {riskLevel === 'unknown' ? 'Analyzing...' : `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Escalation Risk Score</span>
            <span className={cn('font-bold', getRiskColor())}>{riskScore}/100</span>
          </div>
          <Progress 
            value={riskScore} 
            className={cn('h-2', riskLevel === 'critical' && '[&>div]:bg-red-500', riskLevel === 'high' && '[&>div]:bg-orange-500', riskLevel === 'moderate' && '[&>div]:bg-amber-500', riskLevel === 'low' && '[&>div]:bg-green-500')}
          />
        </div>

        {/* Insights */}
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={cn('p-3 rounded-lg border', getInsightBg(insight.type))}
            >
              <div className="flex items-start gap-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  
                  {insight.vitalTypes.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {([...new Set(insight.vitalTypes)] as VitalType[]).map((vt: VitalType) => (
                        <Badge key={vt} variant="outline" className="text-xs gap-1">
                          {getVitalIcon(vt)}
                          {VITAL_THRESHOLDS[vt]?.label.split(' ')[0] || vt}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {insight.recommendation && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      → {insight.recommendation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground border-t pt-3">
          AI insights are based on pattern analysis and do not replace clinical assessment. 
          Always follow the individual's health plan and seek medical advice if concerned.
        </p>
      </CardContent>
    </Card>
  );
}
