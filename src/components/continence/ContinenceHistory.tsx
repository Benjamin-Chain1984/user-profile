/**
 * Continence History - Timeline of pad changes and skin checks
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePadChanges, useSkinChecks, useUTITests, useConsumablesChecks } from '@/hooks/useContinence';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Clock,
  Droplets,
  Shield,
  TestTube,
  Package,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import {
  PAD_TYPES,
  PAD_CONDITIONS,
  CHANGE_REASONS,
  SKIN_CONDITIONS,
  PadChangeLog,
  SkinCheck,
} from '@/types/continence';

interface ContinenceHistoryProps {
  clientId?: string;
}

export function ContinenceHistory({ clientId }: ContinenceHistoryProps) {
  const { changes, loading: changesLoading } = usePadChanges(clientId);
  const { checks: skinChecks, loading: skinLoading } = useSkinChecks(clientId);
  const { tests: utiTests, loading: utiLoading } = useUTITests(clientId);
  const { checks: consumablesChecks, loading: consumablesLoading } = useConsumablesChecks(clientId);

  const getPadTypeLabel = (value: string) => PAD_TYPES.find((t) => t.value === value)?.label || value;
  const getPadConditionLabel = (value: string) => PAD_CONDITIONS.find((c) => c.value === value)?.label || value;
  const getChangeReasonLabel = (value: string) => CHANGE_REASONS.find((r) => r.value === value)?.label || value;
  const getSkinConditionLabel = (value: string) => SKIN_CONDITIONS.find((c) => c.value === value)?.label || value;

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'dry':
        return 'bg-green-100 text-green-800';
      case 'lightly_wet':
        return 'bg-blue-100 text-blue-800';
      case 'soaked':
      case 'pad_damaged':
      case 'soiled_faeces':
      case 'mixed':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSkinConditionColor = (condition: string) => {
    switch (condition) {
      case 'clear':
        return 'bg-green-100 text-green-800';
      case 'redness':
      case 'rash':
        return 'bg-amber-100 text-amber-800';
      case 'broken_skin':
      case 'fungal_signs':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOnBehalfBadge = (entry: PadChangeLog | SkinCheck) => {
    if (!entry.recorded_on_behalf_of_name) return null;
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <UserPlus className="h-3 w-3" />
        On behalf of {entry.recorded_on_behalf_of_name}
        {entry.recorded_on_behalf_of_role && ` (${entry.recorded_on_behalf_of_role})`}
      </Badge>
    );
  };

  return (
    <Tabs defaultValue="pad-changes" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="pad-changes" className="gap-1">
          <Droplets className="h-4 w-4" />
          Pad Changes
        </TabsTrigger>
        <TabsTrigger value="skin-checks" className="gap-1">
          <Shield className="h-4 w-4" />
          Skin Checks
        </TabsTrigger>
        <TabsTrigger value="uti-tests" className="gap-1">
          <TestTube className="h-4 w-4" />
          UTI Tests
        </TabsTrigger>
        <TabsTrigger value="consumables" className="gap-1">
          <Package className="h-4 w-4" />
          Consumables
        </TabsTrigger>
      </TabsList>

      {/* Pad Changes Tab */}
      <TabsContent value="pad-changes">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Pad Changes</CardTitle>
            <CardDescription>Last 100 entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {changesLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : changes.length === 0 ? (
                <p className="text-muted-foreground">No pad changes logged yet.</p>
              ) : (
                <div className="space-y-4">
                  {changes.map((change) => (
                    <div
                      key={change.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <Droplets className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getPadTypeLabel(change.pad_type)}</span>
                            <Badge className={getConditionColor(change.pad_condition)}>
                              {getPadConditionLabel(change.pad_condition)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(change.event_occurred_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {change.change_reason.split(',').map((r) => (
                            <Badge key={r} variant="outline">
                              {getChangeReasonLabel(r.trim())}
                            </Badge>
                          ))}
                          {renderOnBehalfBadge(change)}
                        </div>
                        {change.notes && (
                          <p className="text-sm text-muted-foreground">{change.notes}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(change.event_occurred_at), 'dd/MM/yy HH:mm')}
                          {change.scheduled_time
                            ? ` • Sched: ${change.scheduled_time}`
                            : ' • Unscheduled'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Skin Checks Tab */}
      <TabsContent value="skin-checks">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Skin Checks</CardTitle>
            <CardDescription>Last 100 entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {skinLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : skinChecks.length === 0 ? (
                <p className="text-muted-foreground">No skin checks logged yet.</p>
              ) : (
                <div className="space-y-4">
                  {skinChecks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getSkinConditionColor(check.skin_condition)}>
                              {getSkinConditionLabel(check.skin_condition)}
                            </Badge>
                            {check.escalated_to_clinician && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Escalated
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(check.event_occurred_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {check.areas_checked.map((area) => (
                            <Badge key={area} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                        {renderOnBehalfBadge(check)}
                        {check.notes && (
                          <p className="text-sm text-muted-foreground">{check.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* UTI Tests Tab */}
      <TabsContent value="uti-tests">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent UTI Tests</CardTitle>
            <CardDescription>Last 50 entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {utiLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : utiTests.length === 0 ? (
                <p className="text-muted-foreground">No UTI tests logged yet.</p>
              ) : (
                <div className="space-y-4">
                  {utiTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <TestTube className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            className={
                              test.test_result === 'positive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {test.test_result === 'positive' ? 'Positive' : 'Negative'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(test.test_date), 'PP')}
                          </span>
                        </div>
                        {test.symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {test.symptoms.map((symptom) => (
                              <Badge key={symptom} variant="outline" className="text-xs">
                                {symptom.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {test.escalated_to && (
                          <Badge variant="secondary">
                            Escalated: {test.escalated_to === 'gp' ? 'GP' : 'Monitor'}
                          </Badge>
                        )}
                        {test.notes && (
                          <p className="text-sm text-muted-foreground">{test.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Consumables Tab */}
      <TabsContent value="consumables">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Stock Checks</CardTitle>
            <CardDescription>Last 50 entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {consumablesLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : consumablesChecks.length === 0 ? (
                <p className="text-muted-foreground">No stock checks logged yet.</p>
              ) : (
                <div className="space-y-4">
                  {consumablesChecks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Stock Check</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(check.check_date), 'PP')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Pads', level: check.continence_pads_level },
                            { label: 'Creams', level: check.barrier_creams_level },
                            { label: 'Gloves/Wipes', level: check.gloves_wipes_level },
                            { label: 'Cleansers', level: check.cleansing_products_level },
                            { label: 'Sheets', level: check.disposable_sheets_level },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                              <span>{item.label}</span>
                              <Badge
                                className={
                                  item.level === 'good'
                                    ? 'bg-green-100 text-green-800'
                                    : item.level === 'medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {item.level}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {check.notes && (
                          <p className="text-sm text-muted-foreground">{check.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
