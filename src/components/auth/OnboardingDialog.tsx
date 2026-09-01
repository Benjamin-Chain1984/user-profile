/**
 * OnboardingDialog - shown once after a new subscription activates.
 * Business rule: a purchase unlocks the workspace AND starts guided setup.
 * Completion is persisted on profiles.onboarding_completed_at.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Rocket, UserPlus, Users, ToggleRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STEPS = [
  {
    icon: UserPlus,
    title: 'Add your first client',
    description: 'Create a blank client profile from Admin → Clients, then set it up manually.',
  },
  {
    icon: ToggleRight,
    title: 'Enable modules',
    description: 'Turn on the clinical modules you need — each one starts blank and prompts setup.',
  },
  {
    icon: Users,
    title: 'Invite your team',
    description: 'Add staff from Admin → My Team so they can authenticate and log care.',
  },
];

export function OnboardingDialog() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const complete = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    await supabase
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', user.id);
    setIsSaving(false);
  };

  return (
    <Dialog open>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-success/10">
            <Rocket className="h-5 w-5 text-success" aria-hidden />
          </div>
          <DialogTitle>Welcome to IDEAL — let's get set up</DialogTitle>
          <DialogDescription>
            Your subscription is active. Three quick steps and your workspace is ready for care.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 py-2">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {i + 1}. {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="space-y-2">
          <Button asChild className="w-full" onClick={complete} disabled={isSaving}>
            <Link to="/admin/clients">
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Get started — add a client
            </Link>
          </Button>
          <Button variant="ghost" className="w-full" onClick={complete} disabled={isSaving}>
            I'll set up later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
