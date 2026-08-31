/**
 * Print Placemat — renders the person's A4 landscape mealtime placemat directly
 * from the IDDSI module configuration. Nothing clinical is editable here: the
 * food level, drink level, testing methods and QR videos all flow from the
 * module. Only food preferences / likes can be added.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useProfile } from '@/contexts/ProfileContext';
import { useIddsiConfig } from '@/hooks/useIddsi';
import {
  ArrowLeft, Printer, Mail, FileDown, Utensils, CupSoda,
  Heart, Info, Loader2, Lock, AlertTriangle,
} from 'lucide-react';
import {
  getFoodLevelMeta, getDrinkLevelMeta, DEFAULT_PIRATES,
  LAMINATING_STEPS, IddsiLevelMeta, buildEquipmentFromLevels,
} from './placematData';
import { PlacematPreview, PlacematData } from './PlacematPreview';

interface Props {
  clientId?: string;
  onClose: () => void;
}

const PREF_STORAGE_PREFIX = 'iddsi-placemat-prefs:';

export function IddsiPlacematBuilder({ clientId, onClose }: Props) {
  const { profile } = useProfile();
  const { config, loading } = useIddsiConfig(clientId);
  const sheetRef = useRef<HTMLDivElement>(null);

  const storageKey = `${PREF_STORAGE_PREFIX}${clientId ?? profile?.id ?? 'default'}`;
  const [preferences, setPreferences] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setPreferences(localStorage.getItem(storageKey) ?? '');
  }, [storageKey]);

  const savePreferences = (value: string) => {
    setPreferences(value);
    localStorage.setItem(storageKey, value);
  };

  const foodKey = config?.foodLevel != null
    ? (config.foodLevel === 7
      ? (config.foodLevelVariant === 'easy_to_chew' ? '7_easy_to_chew' : '7_regular')
      : String(config.foodLevel))
    : null;
  const drinkKey = config?.drinkLevel != null ? String(config.drinkLevel) : null;

  const food = getFoodLevelMeta(foodKey);
  const drink = getDrinkLevelMeta(drinkKey);

  const pirates = useMemo(() => DEFAULT_PIRATES.map((p) => {
    if (p.key === 'positioning' && config) {
      return {
        ...p,
        value: `Seated upright at ${config.targetSafeAngle}° (minimum ${config.minSafeAngle}°), hips to the back of the chair, feet supported, head in midline. Stay upright 30 minutes after eating.`,
      };
    }
    if (p.key === 'texture') {
      return {
        ...p,
        value: [
          food ? `Food: ${food.name}.` : 'Food level not set in the IDDSI module.',
          drink ? `Drink: ${drink.name}.` : 'Drink level not set in the IDDSI module.',
          'Test every meal and drink before serving.',
        ].join(' '),
      };
    }
    return p;
  }), [config, food, drink]);

  const equipment = useMemo(() => buildEquipmentFromLevels(food, drink), [food, drink]);

  const data: PlacematData = useMemo(() => ({
    name: profile?.fullName ?? '',
    photoUrl: profile?.avatarUrl,
    food,
    drink,
    pirates,
    equipment,
    preferences,
    instructions: config?.additionalInstructions ?? '',
    organisation: '',
    reviewDate: config?.nextReviewDue?.slice(0, 10) ?? '',
  }), [profile, food, drink, pirates, equipment, preferences, config]);

  /** Validate both QR targets resolve to level-specific official IDDSI resources */
  const validate = (): boolean => {
    const problems: string[] = [];
    if (!food) problems.push('Food level is not set in IDDSI Settings');
    if (!drink) problems.push('Drink level is not set in IDDSI Settings');
    for (const [label, meta] of [['Food', food], ['Drink', drink]] as [string, IddsiLevelMeta | null][]) {
      if (meta && !/^https:\/\/(www\.youtube\.com|iddsi\.org)/.test(meta.videoUrl)) {
        problems.push(`${label} QR target is not an official IDDSI resource`);
      }
    }
    if (problems.length) {
      toast({ title: 'Cannot print placemat', description: problems.join(' · '), variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handlePrint = () => {
    if (!validate()) return;
    window.print();
  };

  const handlePdf = async (): Promise<boolean> => {
    if (!validate() || !sheetRef.current) return false;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(sheetRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Front page (top half)
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);

      // Back page (bottom half)
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = canvas.width;
      cropCanvas.height = canvas.height / 2;
      const ctx = cropCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, canvas.height / 2, canvas.width, canvas.height / 2, 0, 0, canvas.width, canvas.height / 2);
      }
      pdf.addPage('a4', 'landscape');
      pdf.addImage(cropCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);

      pdf.save(`IDDSI-Placemat-${(data.name || 'person').replace(/\s+/g, '-')}.pdf`);
      toast({ title: 'PDF downloaded', description: 'Front and back pages downloaded. Print double-sided if possible.' });
      return true;
    } catch (e) {
      toast({ title: 'PDF export failed', description: (e as Error).message, variant: 'destructive' });
      return false;
    } finally {
      setExporting(false);
    }
  };

  const handleEmail = async () => {
    if (!(await handlePdf())) return;
    const body = [
      `IDDSI Mealtime Placemat — ${data.name}`,
      '',
      `FOOD: ${food?.name ?? 'Not set'}`,
      `Food testing: ${food?.tests.join(', ') ?? '—'}`,
      `Food testing video: ${food?.videoUrl ?? '—'}`,
      '',
      `DRINK: ${drink?.name ?? 'Not set'}`,
      `Drink testing: ${drink?.tests.join(', ') ?? '—'}`,
      `Drink testing video: ${drink?.videoUrl ?? '—'}`,
      '',
      'The A4 landscape placemat PDF has been downloaded to this device — please attach it to this email before sending.',
    ].join('\n');
    window.location.href =
      `mailto:?subject=${encodeURIComponent(`IDDSI Mealtime Placemat – ${data.name}`)}&body=${encodeURIComponent(body)}`;
  };

  const LevelSummary = ({ label, meta, Icon }: { label: string; meta: IddsiLevelMeta | null; Icon: typeof Utensils }) => (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <span
        className="h-11 w-11 rounded-lg flex items-center justify-center text-lg font-black flex-shrink-0 border-2 border-foreground/70"
        style={{ background: meta?.color ?? 'hsl(var(--muted))', color: meta?.onColor ?? 'hsl(var(--muted-foreground))' }}
      >
        {meta?.level ?? '–'}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <Icon className="h-3 w-3" />{label}
        </p>
        <p className="text-sm font-semibold leading-tight">{meta?.name ?? 'Not set in IDDSI Settings'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-hidden">
      <div className="flex items-center gap-3 no-print">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Print Placemat</h2>
          <p className="text-sm text-muted-foreground">
            Generated automatically from this person's IDDSI configuration
          </p>
        </div>
      </div>

      {!loading && (!food || !drink) && (
        <Alert variant="destructive" className="no-print">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Set the food and drink levels in the IDDSI <strong>Settings</strong> tab before printing the placemat.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid min-w-0 max-w-full lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-5 items-start">
        <div className="space-y-4 no-print">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />From IDDSI module
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LevelSummary label="Food texture" meta={food} Icon={Utensils} />
              <LevelSummary label="Drink thickness" meta={drink} Icon={CupSoda} />
              <div className="flex flex-wrap gap-2">
                {food && <Badge variant="secondary">Food QR → {food.videoTitle}</Badge>}
                {drink && <Badge variant="secondary">Drink QR → {drink.videoTitle}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                Levels, symbols, testing methods and both QR videos are taken from the module — change them in
                IDDSI Settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />Food preferences & likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={6}
                value={preferences}
                onChange={(e) => savePreferences(e.target.value)}
                placeholder="Likes, dislikes, allergies, cultural or religious preferences, favourite meals…"
              />
              <p className="text-xs text-muted-foreground mt-2">The only editable part of the placemat.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Print & share</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handlePrint} className="w-full h-12 text-base">
                <Printer className="h-5 w-5 mr-2" />Print Placemat
              </Button>
              <Button variant="outline" onClick={handlePdf} disabled={exporting} className="w-full h-12 text-base">
                {exporting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <FileDown className="h-5 w-5 mr-2" />}
                Download PDF (A4 landscape)
              </Button>
              <Button variant="outline" onClick={handleEmail} disabled={exporting} className="w-full h-12 text-base">
                <Mail className="h-5 w-5 mr-2" />Email Placemat
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" />Printing & laminating</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm space-y-1.5 list-decimal pl-5">
                {LAMINATING_STEPS.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 max-w-full space-y-2 overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground no-print">
            Live preview — A4 landscape
          </p>
          <PlacematPreview ref={sheetRef} data={data} />
        </div>
      </div>
    </div>
  );
}
