/**
 * OnboardingDialog - guided 3-step setup shown once after a new subscription activates.
 * Business rule: a purchase unlocks the workspace AND starts guided setup.
 * Step 1 creates the first client, step 2 enables modules for that client,
 * step 3 invites a staff member. Completion is persisted on
 * profiles.onboarding_completed_at.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Rocket,
  ToggleRight,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { clientTokenService } from '@/services/clientToken';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveClient } from '@/contexts/ActiveClientContext';
import { HEALTH_MODULES } from '@/types/ideal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AppRole } from '@/services/auth/types';

const STEPS = [
  { icon: UserPlus, label: 'Add client' },
  { icon: ToggleRight, label: 'Enable modules' },
  { icon: Users, label: 'Invite staff' },
];

/** Australian-first E.164 normalisation, matching the My Team flow. */
function formatPhoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '+61' + digits.slice(1);
  if (!digits.startsWith('61')) return '+61' + digits;
  return '+' + digits;
}

export function OnboardingDialog() {
  const { user } = useAuth();
  const { setActiveClient } = useActiveClient();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1 — client
  const [clientName, setClientName] = useState('');
  const [beaconId, setBeaconId] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);

  // Step 2 — modules
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Step 3 — staff
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<AppRole>('worker');
  const [tempPassword, setTempPassword] = useState('');

  const completeOnboarding = async (redirect: string | null) => {
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id);
    }
    if (redirect) navigate(redirect);
  };

  const finishLater = async () => {
    setIsSaving(true);
    await completeOnboarding(null);
    setIsSaving(false);
  };

  // ── Step 1: create the first client ─────────────────────────
  const createClient = async () => {
    if (!clientName.trim()) {
      toast.error('Client name is required');
      return;
    }
    setIsSaving(true);
    try {
      const token = clientTokenService.generateSecureToken();
      const tokenHash = await clientTokenService.hashToken(token);

      const { data, error } = await supabase
        .from('clients')
        .insert({
          preferred_name: clientName.trim(),
          beacon_id: beaconId.trim() || null,
          status: 'active',
          poster_qr_token_hash: tokenHash,
          poster_qr_token_plain: token,
          enabled_modules: [],
        } as any)
        .select('id, preferred_name')
        .single();

      if (error) throw error;

      setClientId(data.id);
      setActiveClient(data.id, data.preferred_name);
      toast.success(`${data.preferred_name} created — profile starts blank`);
      setStep(1);
    } catch (err: any) {
      console.error('Onboarding: create client failed', err);
      toast.error(
        String(err?.message || '').includes('beacon_id')
          ? 'This Beacon ID is already assigned to another client'
          : 'Could not create the client'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Step 2: enable modules on that client ───────────────────
  const saveModules = async () => {
    if (!clientId) {
      setStep(2);
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ enabled_modules: selectedModules } as any)
        .eq('id', clientId);
      if (error) throw error;
      toast.success(
        selectedModules.length
          ? `${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''} enabled — each needs setup in its Settings tab`
          : 'No modules enabled yet — you can turn them on any time'
      );
      setStep(2);
    } catch (err) {
      console.error('Onboarding: save modules failed', err);
      toast.error('Could not save the module selection');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Step 3: invite a staff member ───────────────────────────
  const inviteStaff = async () => {
    if (!staffName.trim() || !staffEmail.trim()) {
      toast.error('Name and email are required to invite a staff member');
      return;
    }
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: {
          email: staffEmail.trim(),
          fullName: staffName.trim(),
          role: staffRole,
          phone: formatPhoneToE164(staffPhone),
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setTempPassword(data?.tempPassword || '');
      toast.success(`${staffName.trim()} invited`);
      setStep(3);
    } catch (err: any) {
      console.error('Onboarding: invite staff failed', err);
      toast.error(err?.message || 'Could not invite the staff member');
    } finally {
      setIsSaving(false);
    }
  };

  const finish = async () => {
    setIsSaving(true);
    await completeOnboarding(clientId ? '/dashboard' : '/admin/clients');
    setIsSaving(false);
  };

  const toggleModule = (id: string) =>
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );

  return (
    <Dialog open>
      <DialogContent
        className="max-w-lg max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-success/10">
            <Rocket className="h-5 w-5 text-success" aria-hidden />
          </div>
          <DialogTitle>
            {step === 3 ? "You're all set" : "Welcome to IDEAL — let's get set up"}
          </DialogTitle>
          <DialogDescription>
            {step === 3
              ? 'Your workspace is ready for care.'
              : 'Your subscription is active. Three quick steps and your workspace is ready.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = step > i;
            const current = step === i;
            return (
              <div key={s.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    done
                      ? 'border-success bg-success/10 text-success'
                      : current
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <s.icon className="h-4 w-4" aria-hidden />
                  )}
                </div>
                <span
                  className={`text-[11px] ${current ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step 1 */}
        {step === 0 && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Create your first client. The profile starts completely blank — details are added
              manually afterwards.
            </p>
            <div className="space-y-2">
              <Label htmlFor="onboard-client-name">Preferred name *</Label>
              <Input
                id="onboard-client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Jimmy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-beacon">Beacon ID (optional)</Label>
              <Input
                id="onboard-beacon"
                value={beaconId}
                onChange={(e) => setBeaconId(e.target.value)}
                placeholder="e.g. BCN-000123"
              />
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={createClient} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Create client & continue
              </Button>
              <Button variant="ghost" className="w-full" onClick={finishLater} disabled={isSaving}>
                I'll set up later
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Choose the clinical modules {clientName.trim() || 'this client'} needs. Each module
              starts blank and prompts you to complete its Settings.
            </p>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {HEALTH_MODULES.map((m) => (
                <label
                  key={m.id}
                  htmlFor={`onboard-mod-${m.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`onboard-mod-${m.id}`}
                    checked={selectedModules.includes(m.id)}
                    onCheckedChange={() => toggleModule(m.id)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{m.name}</span>
                    <span className="block text-xs text-muted-foreground">{m.description}</span>
                  </span>
                </label>
              ))}
            </div>
            <Button className="w-full" onClick={saveModules} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {selectedModules.length ? 'Enable modules & continue' : 'Skip for now'}
            </Button>
          </div>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Invite a staff member so they can authenticate and log care. You can add more later
              from Admin → My Team.
            </p>
            <div className="space-y-2">
              <Label htmlFor="onboard-staff-name">Full name</Label>
              <Input
                id="onboard-staff-name"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Sarah Nguyen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-staff-email">Email</Label>
              <Input
                id="onboard-staff-email"
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="staff@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-staff-phone">Mobile (optional)</Label>
              <Input
                id="onboard-staff-phone"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                placeholder="0412 345 678"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={staffRole} onValueChange={(v) => setStaffRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">Support Worker</SelectItem>
                  <SelectItem value="team_leader">Team Leader</SelectItem>
                  <SelectItem value="clinician">Clinician</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={inviteStaff} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Users className="mr-2 h-4 w-4" />
                )}
                Invite staff member
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep(3)}
                disabled={isSaving}
              >
                Skip — I'll invite my team later
              </Button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 3 && (
          <div className="space-y-4 pt-2">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                {clientId ? `Client ${clientName.trim()} created` : 'Client setup pending'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                {selectedModules.length
                  ? `${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''} enabled`
                  : 'Modules can be enabled any time'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                {tempPassword ? 'Staff member invited' : 'Team invites pending'}
              </li>
            </ul>

            {tempPassword && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Share these credentials securely. The staff member should change their password on
                  first sign-in.
                </p>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={staffEmail} readOnly className="bg-muted text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Temporary password</Label>
                  <Input value={tempPassword} readOnly className="bg-muted font-mono text-sm" />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Next: open each enabled module's Settings tab to complete its clinical configuration —
              modules stay in Amber until they're set up.
            </p>

            <Button className="w-full" onClick={finish} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Go to my workspace
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
