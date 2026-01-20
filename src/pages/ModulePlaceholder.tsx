import { useParams, useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HEALTH_MODULES } from '@/types/ideal';

export default function ModulePlaceholder() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const module = HEALTH_MODULES.find(m => m.id === moduleId);
  const moduleName = module?.name || moduleId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Module';

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Coming Soon Card */}
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <Construction className="w-8 h-8 text-warning" />
            </div>
            <CardTitle className="text-2xl">{moduleName}</CardTitle>
            <CardDescription className="text-base">
              Coming Soon — Under Construction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              This module is currently being developed and will be available soon.
              We're working hard to bring you the best experience for tracking and managing {moduleName.toLowerCase()}.
            </p>

            {module?.description && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-foreground">
                  <strong>What this module will do:</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {module.description}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" className="gap-2">
                <Bell className="w-4 h-4" />
                Notify Me When Ready
              </Button>
              <Button onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Development Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Module ID: <code className="px-1.5 py-0.5 bg-muted rounded">{moduleId}</code></p>
        </div>
      </div>
    </div>
  );
}
