/**
 * Enteral Feeding Schedule - Grouped feed entries + standalone flushes
 * Feeds: flush before → feed → flush after at a scheduled time
 * Flushes: standalone water flush at a scheduled time
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Clock, Droplets, Apple } from 'lucide-react';

export interface FeedingScheduleEntry {
  id: string;
  time: string;
  type: 'feed' | 'flush';
  feed_ml: number;
  flush_before_ml: number;
  flush_after_ml: number;
  flush_ml?: number;
}

interface EnteralFeedingScheduleProps {
  schedule: FeedingScheduleEntry[];
  onChange?: (schedule: FeedingScheduleEntry[]) => void;
  readOnly?: boolean;
}

const DEFAULT_SCHEDULE: FeedingScheduleEntry[] = [
  { id: '1', time: '07:00', type: 'feed', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
  { id: '2', time: '10:00', type: 'feed', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
  { id: '3', time: '12:00', type: 'flush', flush_before_ml: 0, feed_ml: 0, flush_after_ml: 0, flush_ml: 100 },
  { id: '4', time: '13:00', type: 'feed', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
  { id: '5', time: '16:00', type: 'feed', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
  { id: '6', time: '20:00', type: 'feed', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
];

export function getScheduleTotals(schedule: FeedingScheduleEntry[]) {
  const formulaTotal = schedule
    .filter(e => (e.type || 'feed') === 'feed')
    .reduce((s, e) => s + (e.feed_ml || 0), 0);
  const flushTotal = schedule.reduce((s, e) => {
    if ((e.type || 'feed') === 'flush') return s + (e.flush_ml || 0);
    return s + (e.flush_before_ml || 0) + (e.flush_after_ml || 0);
  }, 0);
  return { formulaTotal, flushTotal, grandTotal: formulaTotal + flushTotal };
}

export { DEFAULT_SCHEDULE };

/** Helper to get entry total mL */
function entryTotal(e: FeedingScheduleEntry): number {
  if ((e.type || 'feed') === 'flush') return e.flush_ml || 0;
  return (e.flush_before_ml || 0) + (e.feed_ml || 0) + (e.flush_after_ml || 0);
}

export function EnteralFeedingSchedule({ schedule, onChange, readOnly = false }: EnteralFeedingScheduleProps) {
  const { formulaTotal, flushTotal, grandTotal } = getScheduleTotals(schedule);

  // Count feeds only for labeling
  let feedCounter = 0;

  const addFeed = () => {
    if (!onChange) return;
    const newEntry: FeedingScheduleEntry = {
      id: crypto.randomUUID(),
      time: '08:00',
      type: 'feed',
      flush_before_ml: 50,
      feed_ml: 250,
      flush_after_ml: 50,
    };
    onChange([...schedule, newEntry].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const addFlush = () => {
    if (!onChange) return;
    const newEntry: FeedingScheduleEntry = {
      id: crypto.randomUUID(),
      time: '12:00',
      type: 'flush',
      flush_before_ml: 0,
      feed_ml: 0,
      flush_after_ml: 0,
      flush_ml: 100,
    };
    onChange([...schedule, newEntry].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const removeEntry = (id: string) => {
    if (!onChange) return;
    onChange(schedule.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof FeedingScheduleEntry, value: any) => {
    if (!onChange) return;
    const updated = schedule.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    );
    if (field === 'time') {
      updated.sort((a, b) => a.time.localeCompare(b.time));
    }
    onChange(updated);
  };

  const loadDefaults = () => {
    if (!onChange) return;
    onChange(DEFAULT_SCHEDULE.map(e => ({ ...e, id: crypto.randomUUID() })));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Feeding Schedule
          </CardTitle>
          {!readOnly && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={loadDefaults} className="text-xs">
                Load Example
              </Button>
              <Button variant="outline" size="sm" onClick={addFeed} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Feed
              </Button>
              <Button variant="outline" size="sm" onClick={addFlush} className="gap-1 text-blue-600">
                <Plus className="h-3.5 w-3.5" /> Flush
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedule.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No schedule configured. {!readOnly && 'Add feeds/flushes or load an example.'}
          </p>
        )}

        {schedule.map((entry) => {
          const isFeed = (entry.type || 'feed') === 'feed';
          if (isFeed) feedCounter++;
          const feedNumber = feedCounter;

          if (isFeed) {
            // ── Feed card ──
            const totalMl = entryTotal(entry);
            return (
              <div key={entry.id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Apple className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-primary">Feed {feedNumber}</span>
                    {readOnly ? (
                      <span className="font-mono text-sm text-muted-foreground">{entry.time}</span>
                    ) : (
                      <Input
                        type="time"
                        value={entry.time}
                        onChange={e => updateEntry(entry.id, 'time', e.target.value)}
                        className="h-8 w-[130px] text-sm"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">{totalMl} mL</span>
                    {!readOnly && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeEntry(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-2 text-center space-y-1">
                    <Droplets className="h-3.5 w-3.5 mx-auto text-blue-500" />
                    <p className="text-[10px] text-muted-foreground">Flush Before</p>
                    {readOnly ? (
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{entry.flush_before_ml} mL</p>
                    ) : (
                      <Input type="number" value={entry.flush_before_ml} onChange={e => updateEntry(entry.id, 'flush_before_ml', parseInt(e.target.value) || 0)} className="h-8 text-sm text-center bg-background" min={0} />
                    )}
                  </div>
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-2 text-center space-y-1">
                    <Apple className="h-3.5 w-3.5 mx-auto text-amber-600" />
                    <p className="text-[10px] text-muted-foreground">Feed</p>
                    {readOnly ? (
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{entry.feed_ml} mL</p>
                    ) : (
                      <Input type="number" value={entry.feed_ml} onChange={e => updateEntry(entry.id, 'feed_ml', parseInt(e.target.value) || 0)} className="h-8 text-sm text-center bg-background" min={0} />
                    )}
                  </div>
                  <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-2 text-center space-y-1">
                    <Droplets className="h-3.5 w-3.5 mx-auto text-blue-500" />
                    <p className="text-[10px] text-muted-foreground">Flush After</p>
                    {readOnly ? (
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{entry.flush_after_ml} mL</p>
                    ) : (
                      <Input type="number" value={entry.flush_after_ml} onChange={e => updateEntry(entry.id, 'flush_after_ml', parseInt(e.target.value) || 0)} className="h-8 text-sm text-center bg-background" min={0} />
                    )}
                  </div>
                </div>
              </div>
            );
          } else {
            // ── Standalone Flush card ──
            return (
              <div key={entry.id} className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Water Flush</span>
                    {readOnly ? (
                      <span className="font-mono text-sm text-muted-foreground">{entry.time}</span>
                    ) : (
                      <Input
                        type="time"
                        value={entry.time}
                        onChange={e => updateEntry(entry.id, 'time', e.target.value)}
                        className="h-8 w-[130px] text-sm"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {readOnly ? (
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{entry.flush_ml || 0} mL</span>
                    ) : (
                      <Input
                        type="number"
                        value={entry.flush_ml || 0}
                        onChange={e => updateEntry(entry.id, 'flush_ml', parseInt(e.target.value) || 0)}
                        className="h-8 w-[80px] text-sm text-center bg-background"
                        min={0}
                      />
                    )}
                    <span className="text-xs text-muted-foreground">mL</span>
                    {!readOnly && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeEntry(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        })}

        {/* Totals */}
        {schedule.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
              <Apple className="h-4 w-4 mx-auto mb-1 text-amber-600" />
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formulaTotal} mL</p>
              <p className="text-xs text-muted-foreground">Formula</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
              <Droplets className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{flushTotal} mL</p>
              <p className="text-xs text-muted-foreground">Flushes</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold">{grandTotal} mL</p>
              <p className="text-xs text-muted-foreground">Daily Total</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
