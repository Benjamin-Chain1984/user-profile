/**
 * HealthPreventionHistory - History/trends view for Health Prevention module
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useHealthPrevention } from '@/hooks/useHealthPrevention';
import { FileSearch, Syringe, Calendar, User, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { CANCER_SCREENING_PROGRAMS, VACCINATION_PROGRAMS } from '@/types/healthPrevention';

export function HealthPreventionHistory() {
  const { screeningRecords, vaccinationRecords, isLoading } = useHealthPrevention();
  const [activeTab, setActiveTab] = useState<'screenings' | 'vaccinations'>('screenings');

  const getScreeningName = (type: string) => {
    return CANCER_SCREENING_PROGRAMS.find(p => p.id === type)?.name || type;
  };

  const getVaccinationName = (type: string) => {
    return VACCINATION_PROGRAMS.find(p => p.id === type)?.name || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Up to date</Badge>;
      case 'deferred':
        return <Badge variant="outline">Deferred</Badge>;
      case 'not_applicable':
        return <Badge variant="secondary">Not applicable</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'screenings' | 'vaccinations')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="screenings" className="gap-2">
            <FileSearch className="h-4 w-4" />
            Screenings
          </TabsTrigger>
          <TabsTrigger value="vaccinations" className="gap-2">
            <Syringe className="h-4 w-4" />
            Vaccinations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screenings" className="mt-4">
          {screeningRecords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No screening records yet.</p>
                <p className="text-sm">Records will appear here when screenings are logged.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {screeningRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{getScreeningName(record.screeningType)}</span>
                      {getStatusBadge(record.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {record.dateCompleted && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Completed: {format(new Date(record.dateCompleted), 'dd MMM yyyy')}</span>
                      </div>
                    )}
                    
                    {record.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{record.location}</span>
                      </div>
                    )}

                    {record.nextDueDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Next due: {format(new Date(record.nextDueDate), 'dd MMM yyyy')}</span>
                      </div>
                    )}

                    {record.deferredReason && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4 mt-0.5" />
                        <span>Reason: {record.deferredReason}</span>
                      </div>
                    )}

                    {record.notes && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4 mt-0.5" />
                        <span>{record.notes}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Logged {format(new Date(record.createdAt), 'dd MMM yyyy HH:mm')}
                      {record.editedAt && (
                        <span> • Edited {format(new Date(record.editedAt), 'dd MMM yyyy')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-4">
          {vaccinationRecords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Syringe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No vaccination records yet.</p>
                <p className="text-sm">Records will appear here when vaccinations are logged.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {vaccinationRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{getVaccinationName(record.vaccinationType)}</span>
                      {getStatusBadge(record.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {record.dateGiven && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Given: {format(new Date(record.dateGiven), 'dd MMM yyyy')}</span>
                      </div>
                    )}
                    
                    {record.givenBy && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>By: {record.givenBy}</span>
                      </div>
                    )}

                    {record.vaccineBrand && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Syringe className="h-4 w-4" />
                        <span>Brand: {record.vaccineBrand}</span>
                      </div>
                    )}

                    {record.nextDueDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Next due: {format(new Date(record.nextDueDate), 'dd MMM yyyy')}</span>
                      </div>
                    )}

                    {record.notes && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4 mt-0.5" />
                        <span>{record.notes}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Logged {format(new Date(record.createdAt), 'dd MMM yyyy HH:mm')}
                      {record.editedAt && (
                        <span> • Edited {format(new Date(record.editedAt), 'dd MMM yyyy')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
