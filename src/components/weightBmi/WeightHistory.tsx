/**
 * Weight History - Display list of weight entries
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scale, Clock, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWeightBmi } from '@/hooks/useWeightBmi';
import { BMI_CATEGORY_CONFIG } from '@/types/weightBmi';
import { format, parseISO } from 'date-fns';

interface WeightHistoryProps {
  clientId?: string;
}

export function WeightHistory({ clientId }: WeightHistoryProps) {
  const { entries, loading } = useWeightBmi(clientId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading history...
        </CardContent>
      </Card>
    );
  }

  // Calculate weight change between entries
  const getWeightChange = (index: number): { value: number; direction: 'up' | 'down' | 'same' } | null => {
    if (index >= entries.length - 1) return null;
    const current = entries[index].weight_kg;
    const previous = entries[index + 1].weight_kg;
    const change = current - previous;
    return {
      value: Math.abs(change),
      direction: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'same'
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Weight History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No weight entries recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => {
                const weightChange = getWeightChange(index);
                return (
                  <div 
                    key={entry.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        {/* Date & Time */}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {format(parseISO(entry.event_occurred_at), 'dd MMM yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(entry.event_occurred_at), 'HH:mm')}
                          </span>
                        </div>

                        {/* Weight & BMI */}
                        <div className="flex items-baseline gap-3">
                          <span className="text-xl font-bold flex items-center gap-1">
                            <Scale className="h-4 w-4 text-muted-foreground" />
                            {entry.weight_kg} kg
                          </span>
                          {entry.bmi_value && (
                            <span className="text-sm">
                              BMI: {entry.bmi_value}
                              {entry.bmi_category && (
                                <span className={`ml-1 ${BMI_CATEGORY_CONFIG[entry.bmi_category].color}`}>
                                  ({BMI_CATEGORY_CONFIG[entry.bmi_category].label})
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Context Badges */}
                        <div className="flex flex-wrap gap-1">
                          {entry.time_of_day && (
                            <Badge variant="outline" className="text-xs">
                              {entry.time_of_day}
                            </Badge>
                          )}
                          {entry.meal_timing && (
                            <Badge variant="outline" className="text-xs">
                              {entry.meal_timing.replace('_', ' ')}
                            </Badge>
                          )}
                          {entry.wheelchair_context && (
                            <Badge variant="outline" className="text-xs">
                              {entry.wheelchair_context.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>

                        {/* Notes */}
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {entry.notes}
                          </p>
                        )}

                        {/* On Behalf */}
                        {entry.recorded_on_behalf_of_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            Logged by: {entry.recorded_on_behalf_of_name} ({entry.recorded_on_behalf_of_role})
                          </div>
                        )}
                      </div>

                      {/* Weight Change Indicator */}
                      {weightChange && (
                        <div className={`flex items-center gap-1 text-xs ${
                          weightChange.direction === 'up' ? 'text-red-600' :
                          weightChange.direction === 'down' ? 'text-green-600' :
                          'text-muted-foreground'
                        }`}>
                          {weightChange.direction === 'up' && <TrendingUp className="h-3 w-3" />}
                          {weightChange.direction === 'down' && <TrendingDown className="h-3 w-3" />}
                          {weightChange.direction === 'same' && <Minus className="h-3 w-3" />}
                          {weightChange.direction !== 'same' && (
                            <span>{weightChange.value.toFixed(1)} kg</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
