import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Clock, User } from 'lucide-react';
import { FluidIntakeEntry, FluidOutputEntry, URINE_COLOUR_SCALE } from '@/types/fluidBalance';
import { format, parseISO, subDays, subMonths, isAfter } from 'date-fns';

const TIME_FILTERS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '1m', label: 'Last month' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
];

function getFilterDate(filter: string): Date {
  const now = new Date();
  switch (filter) {
    case '24h': return subDays(now, 1);
    case '7d': return subDays(now, 7);
    case '14d': return subDays(now, 14);
    case '1m': return subMonths(now, 1);
    case '6m': return subMonths(now, 6);
    case '12m': return subMonths(now, 12);
    default: return subDays(now, 7);
  }
}

interface FluidHistoryProps {
  intakeEntries: FluidIntakeEntry[];
  outputEntries: FluidOutputEntry[];
  enableOutputLogging: boolean;
}

const formatTime = (dateStr: string) => {
  return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm');
};

const IntakeItem: React.FC<{ entry: FluidIntakeEntry }> = ({ entry }) => (
  <div className="p-3 border rounded-lg space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-500" />
        <span className="font-medium">{entry.fluid_type}</span>
        <Badge variant="secondary">{entry.amount_ml}ml</Badge>
      </div>
      {entry.is_self_reported && (
        <Badge variant="outline" className="text-xs">Self-reported</Badge>
      )}
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      {formatTime(entry.event_occurred_at)}
    </div>
    {entry.recorded_on_behalf_of_name && (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <User className="h-3 w-3" />
        Logged by {entry.recorded_on_behalf_of_name} ({entry.recorded_on_behalf_of_role})
      </div>
    )}
    {entry.notes && (
      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
        {entry.notes}
      </p>
    )}
  </div>
);

const OutputItem: React.FC<{ entry: FluidOutputEntry }> = ({ entry }) => {
  const urineColour = entry.urine_colour 
    ? URINE_COLOUR_SCALE.find(c => c.value === entry.urine_colour) 
    : null;
  
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-orange-500" />
          <span className="font-medium">{entry.output_type}</span>
          <Badge variant="secondary">
            {entry.is_unmeasured ? 'Unmeasured' : `${entry.amount_ml}ml`}
          </Badge>
        </div>
        {urineColour && (
          <div 
            className="w-6 h-6 rounded-full border"
            style={{ backgroundColor: urineColour.color }}
            title={`Urine colour: ${urineColour.label}`}
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {formatTime(entry.event_occurred_at)}
      </div>
      {entry.recorded_on_behalf_of_name && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          Logged by {entry.recorded_on_behalf_of_name} ({entry.recorded_on_behalf_of_role})
        </div>
      )}
      {urineColour && entry.urine_colour && entry.urine_colour >= 5 && (
        <div className="text-xs text-amber-600 font-medium">
          ⚠️ {urineColour.description}
        </div>
      )}
      {entry.notes && (
        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
          {entry.notes}
        </p>
      )}
    </div>
  );
};

export const FluidHistory: React.FC<FluidHistoryProps> = ({
  intakeEntries,
  outputEntries,
  enableOutputLogging
}) => {
  const [timeFilter, setTimeFilter] = useState('7d');

  const filteredIntake = useMemo(() => {
    const cutoff = getFilterDate(timeFilter);
    return intakeEntries.filter(e => isAfter(new Date(e.event_occurred_at), cutoff));
  }, [intakeEntries, timeFilter]);

  const filteredOutput = useMemo(() => {
    const cutoff = getFilterDate(timeFilter);
    return outputEntries.filter(e => isAfter(new Date(e.event_occurred_at), cutoff));
  }, [outputEntries, timeFilter]);

  const filterSelect = (
    <Select value={timeFilter} onValueChange={setTimeFilter}>
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIME_FILTERS.map((f) => (
          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>
              {enableOutputLogging
                ? `${filteredIntake.length} intake, ${filteredOutput.length} output`
                : `${filteredIntake.length} entries`}
            </CardDescription>
          </div>
          {filterSelect}
        </div>
      </CardHeader>
      <CardContent>
        {enableOutputLogging ? (
          <Tabs defaultValue="intake">
            <TabsList className="w-full">
              <TabsTrigger value="intake" className="flex-1">
                Intake ({filteredIntake.length})
              </TabsTrigger>
              <TabsTrigger value="output" className="flex-1">
                Output ({filteredOutput.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="intake">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {filteredIntake.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No intake entries in this period
                    </p>
                  ) : (
                    filteredIntake.map(entry => (
                      <IntakeItem key={entry.id} entry={entry} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="output">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {filteredOutput.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No output entries in this period
                    </p>
                  ) : (
                    filteredOutput.map(entry => (
                      <OutputItem key={entry.id} entry={entry} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredIntake.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No intake entries in this period
                </p>
              ) : (
                filteredIntake.map(entry => (
                  <IntakeItem key={entry.id} entry={entry} />
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};