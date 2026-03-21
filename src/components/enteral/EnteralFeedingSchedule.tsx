/**
 * Enteral Feeding Schedule - Grouped feed entries (flush before → feed → flush after)
 * Each "Feed" combines flush_before_ml, feed_ml, flush_after_ml at a single scheduled time.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Clock, Droplets, Apple } from 'lucide-react';

export interface FeedingScheduleEntry {
  id: string;
  time: string;
  feed_ml: number;
  flush_before_ml: number;
  flush_after_ml: number;
}

interface EnteralFeedingScheduleProps {
  schedule: FeedingScheduleEntry[];
  onChange?: (schedule: FeedingScheduleEntry[]) => void;
  readOnly?: boolean;
}

const DEFAULT_SCHEDULE: FeedingScheduleEntry[] = [
  { id: '1', time: '07:00', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
  { id: '2', time: '10:00', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
  { id: '3', time: '13:00', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
  { id: '4', time: '16:00', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
  { id: '5', time: '20:00', flush_before_ml: 50, feed_ml: 250, flush_after_ml: 50 },
];

export function getScheduleTotals(schedule: FeedingScheduleEntry[]) {
  const formulaTotal = schedule.reduce((s, e) => s + (e.feed_ml || 0), 0);
  const flushTotal = schedule.reduce((s, e) => s + (e.flush_before_ml || 0) + (e.flush_after_ml || 0), 0);
  return { formulaTotal, flushTotal, grandTotal: formulaTotal + flushTotal };
}

export { DEFAULT_SCHEDULE };

export function EnteralFeedingSchedule({ schedule, onChange, readOnly = false }: EnteralFeedingScheduleProps) {
  const { formulaTotal, flushTotal, grandTotal } = getScheduleTotals(schedule);

  const addFeed = () => {
    if (!onChange) return;
    const newEntry: FeedingScheduleEntry = {
      id: crypto.randomUUID(),
      time: '08:00',
      flush_before_ml: 50,
      feed_ml: 250,
      flush_after_ml: 50,
    };
    onChange([...schedule, newEntry].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const removeFeed = (id: string) => {
    if (!onChange) return;
    onChange(schedule.filter(e => e.id !== id));
  };

  const updateFeed = (id: string, field: keyof FeedingScheduleEntry, value: any) => {
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
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={loadDefaults} className="text-xs">
                Load Example
              </Button>
              <Button variant="outline" size="sm" onClick={addFeed} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Feed
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedule.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No schedule configured. {!readOnly && 'Add feeds or load an example.'}
          </p>
        )}

        {schedule.map((entry, index) => {
          const totalMl = (entry.flush_before_ml || 0) + (entry.feed_ml || 0) + (entry.flush_after_ml || 0);

          return (
            <div key={entry.id} className="rounded-lg border bg-card p-3 space-y-2">
              {/* Header row: Feed label + time + delete */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">Feed {index + 1}</span>
                  {readOnly ? (
                    <span className="font-mono text-sm text-muted-foreground">{entry.time}</span>
                  ) : (
                    <Input
                      type="time"
                      value={entry.time}
                      onChange={e => updateFeed(entry.id, 'time', e.target.value)}
                      className="h-8 w-[110px] text-sm"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">{totalMl} mL total</span>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFeed(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Three-column breakdown */}
              <div className="grid grid-cols-3 gap-2">
                {/* Flush Before */}
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-2 text-center space-y-1">
                  <Droplets className="h-3.5 w-3.5 mx-auto text-blue-500" />
                  <p className="text-[10px] text-muted-foreground">Flush Before</p>
                  {readOnly ? (
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{entry.flush_before_ml} mL</p>
                  ) : (
                    <Input
                      type="number"
                      value={entry.flush_before_ml}
                      onChange={e => updateFeed(entry.id, 'flush_before_ml', parseInt(e.target.value) || 0)}
                      className="h-8 text-sm text-center bg-background"
                      min={0}
                    />
                  )}
                </div>

                {/* Feed */}
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-2 text-center space-y-1">
                  <Apple className="h-3.5 w-3.5 mx-auto text-amber-600" />
                  <p className="text-[10px] text-muted-foreground">Feed</p>
                  {readOnly ? (
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{entry.feed_ml} mL</p>
                  ) : (
                    <Input
                      type="number"
                      value={entry.feed_ml}
                      onChange={e => updateFeed(entry.id, 'feed_ml', parseInt(e.target.value) || 0)}
                      className="h-8 text-sm text-center bg-background"
                      min={0}
                    />
                  )}
                </div>

                {/* Flush After */}
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-2 text-center space-y-1">
                  <Droplets className="h-3.5 w-3.5 mx-auto text-blue-500" />
                  <p className="text-[10px] text-muted-foreground">Flush After</p>
                  {readOnly ? (
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{entry.flush_after_ml} mL</p>
                  ) : (
                    <Input
                      type="number"
                      value={entry.flush_after_ml}
                      onChange={e => updateFeed(entry.id, 'flush_after_ml', parseInt(e.target.value) || 0)}
                      className="h-8 text-sm text-center bg-background"
                      min={0}
                    />
                  )}
                </div>
              </div>
            </div>
          );
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
