/**
 * Competency Trends View - Completion rates and overdue tracking
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStaffCompetencyStatus, useBowelCompetencyAttempts } from '@/hooks/useBowelCompetency';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subMonths, isAfter } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface CompetencyTrendsViewProps {
  clientId?: string;
}

export function CompetencyTrendsView({ clientId }: CompetencyTrendsViewProps) {
  const [timeRange, setTimeRange] = useState('12m');
  const { staffStatuses, completedCount, totalStaff, overdueCount, expiringSoonCount } = useStaffCompetencyStatus(clientId);
  const { attempts } = useBowelCompetencyAttempts(clientId);

  const rangeMonths = timeRange === '6m' ? 6 : timeRange === '3m' ? 3 : 12;
  const cutoff = subMonths(new Date(), rangeMonths);

  // Monthly completion data
  const monthlyData = useMemo(() => {
    const filtered = attempts.filter(a => a.passed && isAfter(new Date(a.completed_at), cutoff));
    const months: Record<string, number> = {};
    for (let i = 0; i < rangeMonths; i++) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'MMM yy');
      months[key] = 0;
    }
    filtered.forEach(a => {
      const key = format(new Date(a.completed_at), 'MMM yy');
      if (key in months) months[key]++;
    });
    return Object.entries(months)
      .reverse()
      .map(([month, count]) => ({ month, count }));
  }, [attempts, cutoff, rangeMonths]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const dist = { completed: 0, expiring_soon: 0, overdue: 0 };
    staffStatuses.forEach(s => {
      if (s.status === 'completed') dist.completed++;
      else if (s.status === 'expiring_soon') dist.expiring_soon++;
      else dist.overdue++;
    });
    return [
      { name: 'Completed', value: dist.completed, color: 'hsl(var(--chart-2))' },
      { name: 'Expiring Soon', value: dist.expiring_soon, color: 'hsl(var(--chart-4))' },
      { name: 'Overdue', value: dist.overdue, color: 'hsl(var(--chart-1))' },
    ];
  }, [staffStatuses]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Competency Trends
        </h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">3 months</SelectItem>
            <SelectItem value="6m">6 months</SelectItem>
            <SelectItem value="12m">12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Summary Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Completions Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Completions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data for selected period</p>
          )}
        </CardContent>
      </Card>

      {/* Overdue Staff List */}
      {overdueCount > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Overdue / Not Completed ({overdueCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {staffStatuses
                .filter(s => s.status === 'expired' || s.status === 'not_completed' || s.status === 'invalidated')
                .map(s => (
                  <div key={s.staffId} className="flex items-center justify-between py-2 text-sm">
                    <span>{s.staffName}</span>
                    <Badge variant="destructive" className="text-xs">
                      {s.status === 'not_completed' ? 'Not Done' : s.status === 'invalidated' ? 'Invalidated' : 'Expired'}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
