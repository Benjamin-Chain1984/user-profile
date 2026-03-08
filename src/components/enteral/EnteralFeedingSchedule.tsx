/**
 * Enteral Feeding Schedule - Customizable schedule editor (Admin) and read-only viewer
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Clock, Droplets, Apple } from 'lucide-react';

export interface FeedingScheduleEntry {
  id: string;
  time: string;
  activity: 'water_flush' | 'formula_feed';
  amount_ml: number;
}

interface EnteralFeedingScheduleProps {
  schedule: FeedingScheduleEntry[];
  onChange?: (schedule: FeedingScheduleEntry[]) => void;
  readOnly?: boolean;
}

const ACTIVITY_OPTIONS = [
  { value: 'water_flush', label: 'Water Flush', icon: Droplets, color: 'text-blue-500' },
  { value: 'formula_feed', label: 'Formula Feed', icon: Apple, color: 'text-amber-600' },
] as const;

const DEFAULT_SCHEDULE: FeedingScheduleEntry[] = [
  { id: '1', time: '07:00', activity: 'water_flush', amount_ml: 50 },
  { id: '2', time: '07:05', activity: 'formula_feed', amount_ml: 250 },
  { id: '3', time: '07:20', activity: 'water_flush', amount_ml: 50 },
  { id: '4', time: '10:00', activity: 'water_flush', amount_ml: 50 },
  { id: '5', time: '10:05', activity: 'formula_feed', amount_ml: 250 },
  { id: '6', time: '10:20', activity: 'water_flush', amount_ml: 50 },
  { id: '7', time: '13:00', activity: 'water_flush', amount_ml: 50 },
  { id: '8', time: '13:05', activity: 'formula_feed', amount_ml: 250 },
  { id: '9', time: '13:20', activity: 'water_flush', amount_ml: 50 },
  { id: '10', time: '16:00', activity: 'water_flush', amount_ml: 50 },
  { id: '11', time: '16:05', activity: 'formula_feed', amount_ml: 250 },
  { id: '12', time: '16:20', activity: 'water_flush', amount_ml: 50 },
  { id: '13', time: '20:00', activity: 'water_flush', amount_ml: 50 },
  { id: '14', time: '20:05', activity: 'formula_feed', amount_ml: 250 },
  { id: '15', time: '20:20', activity: 'water_flush', amount_ml: 50 },
];

export function getScheduleTotals(schedule: FeedingScheduleEntry[]) {
  const formulaTotal = schedule
    .filter(e => e.activity === 'formula_feed')
    .reduce((s, e) => s + e.amount_ml, 0);
  const flushTotal = schedule
    .filter(e => e.activity === 'water_flush')
    .reduce((s, e) => s + e.amount_ml, 0);
  return { formulaTotal, flushTotal, grandTotal: formulaTotal + flushTotal };
}

export { DEFAULT_SCHEDULE };

export function EnteralFeedingSchedule({ schedule, onChange, readOnly = false }: EnteralFeedingScheduleProps) {
  const { formulaTotal, flushTotal, grandTotal } = getScheduleTotals(schedule);

  const addRow = () => {
    if (!onChange) return;
    const newEntry: FeedingScheduleEntry = {
      id: crypto.randomUUID(),
      time: '08:00',
      activity: 'water_flush',
      amount_ml: 50,
    };
    onChange([...schedule, newEntry].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const removeRow = (id: string) => {
    if (!onChange) return;
    onChange(schedule.filter(e => e.id !== id));
  };

  const updateRow = (id: string, field: keyof FeedingScheduleEntry, value: any) => {
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
              <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-[100px] text-right">Amount</TableHead>
                {!readOnly && <TableHead className="w-[50px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.length === 0 && (
                <TableRow>
                  <TableCell colSpan={readOnly ? 3 : 4} className="text-center text-muted-foreground py-8">
                    No schedule configured. {!readOnly && 'Add rows or load an example.'}
                  </TableCell>
                </TableRow>
              )}
              {schedule.map(entry => {
                const activityMeta = ACTIVITY_OPTIONS.find(a => a.value === entry.activity);
                const ActivityIcon = activityMeta?.icon || Droplets;
                return (
                  <TableRow key={entry.id} className={entry.activity === 'formula_feed' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}>
                    <TableCell>
                      {readOnly ? (
                        <span className="font-mono text-sm">{entry.time}</span>
                      ) : (
                        <Input
                          type="time"
                          value={entry.time}
                          onChange={e => updateRow(entry.id, 'time', e.target.value)}
                          className="h-8 w-[90px] text-sm"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <div className="flex items-center gap-2">
                          <ActivityIcon className={`h-4 w-4 ${activityMeta?.color}`} />
                          <span className="text-sm">{activityMeta?.label}</span>
                        </div>
                      ) : (
                        <Select
                          value={entry.activity}
                          onValueChange={v => updateRow(entry.id, 'activity', v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <opt.icon className={`h-3.5 w-3.5 ${opt.color}`} />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {readOnly ? (
                        <span className="text-sm font-medium">{entry.amount_ml} mL</span>
                      ) : (
                        <Input
                          type="number"
                          value={entry.amount_ml}
                          onChange={e => updateRow(entry.id, 'amount_ml', parseInt(e.target.value) || 0)}
                          className="h-8 w-[80px] text-sm text-right ml-auto"
                          min={0}
                        />
                      )}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRow(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
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
      </CardContent>
    </Card>
  );
}
