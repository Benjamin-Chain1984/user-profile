/**
 * IDDSI Placemat Builder — step-by-step builder with live A4 landscape preview,
 * print output, PDF export and email sharing.
 */

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useProfile } from '@/contexts/ProfileContext';
import { useIddsiConfig } from '@/hooks/useIddsi';
import {
  ArrowLeft, Printer, Mail, FileDown, Upload, Utensils, CupSoda,
  User, Sparkles, Package, QrCode, Info, Plus, Check, Loader2,
} from 'lucide-react';
import {
  PLACEMAT_FOOD_LEVELS, PLACEMAT_DRINK_LEVELS, getFoodLevelMeta, getDrinkLevelMeta,
  DEFAULT_PIRATES, EQUIPMENT_OPTIONS, LAMINATING_STEPS, PiratesItem, IddsiLevelMeta,
} from './placematData';
import { PlacematPreview, PlacematData } from './PlacematPreview';

interface Props {
  clientId?: string;
  onClose: () => void;
}

const STEPS = [
  { id: 1, label: 'Person', icon: User },
  { id: 2, label: 'Food & Drink', icon: Utensils },
  { id: 3, label: 'PIRATES', icon: Sparkles },
  { id: 4, label: 'Equipment', icon: Package },
  { id: 5, label: 'IDDSI Testing', icon: QrCode },
  { id: 6, label: 'Preview & Share', icon: Printer },
];

export function IddsiPlacematBuilder({ clientId, onClose }: Props) {
  const { profile } = useProfile();
  const { config } = useIddsiConfig(clientId);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.fullName ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(profile?.avatarUrl);
  const [organisation, setOrganisation] = useState('');
  const [reviewDate, setReviewDate] = useState(config?.nextReviewDue?.slice(0, 10) ?? '');
  const [preferences, setPreferences] = useState('');
  const [pirates, setPirates] = useState<PiratesItem[]>(DEFAULT_PIRATES);
  const [equipment, setEquipment] = useState<string[]>(['Non-slip mat', 'Teaspoon', 'Prescribed cup']);
  const [customEquipment, setCustomEquipment] = useState('');
  const [exporting, setExporting] = useState(false);

  const initialFoodKey = config?.foodLevel != null
    ? (config.foodLevel === 7 ? (config.foodLevelVariant === 'easy_to_chew' ? '7_easy_to_chew' : '7_regular') : String(config.foodLevel))
    : null;
  const [foodKey, setFoodKey] = useState<string | null>(initialFoodKey);
  const [drinkKey, setDrinkKey] = useState<string | null>(config?.drinkLevel != null ? String(config.drinkLevel) : null);

  // Keep prefill in sync once config/profile arrive
  const prefilled = useRef(false);
  if (!prefilled.current && (config || profile?.fullName)) {
    prefilled.current = true;
    if (!name && profile?.fullName) setName(profile.fullName);
    if (!photoUrl && profile?.avatarUrl) setPhotoUrl(profile.avatarUrl);
    if (!foodKey && initialFoodKey) setFoodKey(initialFoodKey);
    if (!drinkKey && config?.drinkLevel != null) setDrinkKey(String(config.drinkLevel));
  }

  const food = getFoodLevelMeta(foodKey);
  const drink = getDrinkLevelMeta(drinkKey);

  const data: PlacematData = useMemo(() => ({
    name, photoUrl, food, drink, pirates, equipment, preferences, organisation, reviewDate,
  }), [name, photoUrl, food, drink, pirates, equipment, preferences, organisation, reviewDate]);

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleEquipment = (item: string) =>
    setEquipment((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  const addCustomEquipment = () => {
    const v = customEquipment.trim();
    if (!v) return;
    if (!equipment.includes(v)) setEquipment((p) => [...p, v]);
    setCustomEquipment('');
  };

  /** Validate both QR targets resolve to level-specific official IDDSI resources */
  const validateQrCodes = (): boolean => {
    const problems: string[] = [];
    if (!food) problems.push('Food level not selected');
    if (!drink) problems.push('Drink level not selected');
    for (const [label, meta] of [['Food', food], ['Drink', drink]] as [string, IddsiLevelMeta | null][]) {
      if (meta && !/^https:\/\/(www\.youtube\.com|iddsi\.org)/.test(meta.videoUrl)) {
        problems.push(`${label} QR target is not an official IDDSI resource`);
      }
    }
    if (problems.length) {
      toast({ title: 'Check the placemat', description: problems.join(' · '), variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handlePrint = () => {
    if (!validateQrCodes()) return;
    window.print();
  };

  const handlePdf = async () => {
    if (!validateQrCodes()) return;
    if (!sheetRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(sheetRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);
      pdf.save(`IDDSI-Placemat-${(name || 'person').replace(/\s+/g, '-')}.pdf`);
      toast({ title: 'PDF downloaded', description: 'Attach the PDF to your email to share the placemat.' });
    } catch (e) {
      toast({ title: 'PDF export failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleEmail = async () => {
    if (!validateQrCodes()) return;
    await handlePdf();
    const body = [
      `IDDSI Mealtime Placemat — ${name}`,
      '',
      `FOOD: ${food?.name ?? 'Not set'}`,
      `Food testing: ${food?.tests.join(', ') ?? '—'}`,
      `Food testing video: ${food?.videoUrl ?? '—'}`,
      '',
      `DRINK: ${drink?.name ?? 'Not set'}`,
      `Drink testing: ${drink?.tests.join(', ') ?? '—'}`,
      `Drink testing video: ${drink?.videoUrl ?? '—'}`,
      '',
      `Equipment: ${equipment.join(', ') || '—'}`,
      '',
      'The A4 landscape placemat PDF has been downloaded to this device — please attach it to this email before sending.',
    ].join('\n');
    window.location.href =
      `mailto:?subject=${encodeURIComponent(`IDDSI Mealtime Placemat – ${name}`)}&body=${encodeURIComponent(body)}`;
  };

  const LevelButton = ({ meta, selected, onSelect }: { meta: IddsiLevelMeta; selected: boolean; onSelect: () => void }) => (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all active:scale-[0.99] ${
        selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'
      }`}
    >
      <span
        className="h-11 w-11 rounded-lg flex items-center justify-center text-lg font-black flex-shrink-0 border-2 border-foreground/70"
        style={{ background: meta.color, color: meta.onColor }}
      >
        {meta.level}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">{meta.name}</span>
        <span className="block text-xs text-muted-foreground leading-snug line-clamp-2">{meta.descriptor}</span>
      </span>
      {selected && <Check className="h-4 w-4 text-primary ml-auto flex-shrink-0" />}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 no-print">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">IDDSI Placemat Builder</h2>
          <p className="text-sm text-muted-foreground">Create a personalised A4 landscape mealtime placemat</p>
        </div>
      </div>

      {/* Step nav */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 no-print">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-h-[72px] justify-center ${
                active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-[11px] font-semibold text-center leading-tight">{s.id}. {s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-5 items-start">
        {/* ── Editor ── */}
        <div className="space-y-4 no-print">
          {step === 1 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">1. Person</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-border bg-muted flex items-center justify-center flex-shrink-0">
                    {photoUrl ? <img src={photoUrl} alt={name} className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placemat-photo" className="text-sm">Photo</Label>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <label htmlFor="placemat-photo" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />Upload
                        </label>
                      </Button>
                      {profile?.avatarUrl && (
                        <Button variant="ghost" size="sm" onClick={() => setPhotoUrl(profile.avatarUrl)}>Use profile photo</Button>
                      )}
                    </div>
                    <input
                      id="placemat-photo" type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placemat-name">Name</Label>
                  <Input id="placemat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placemat-org">Service / organisation (optional)</Label>
                  <Input id="placemat-org" value={organisation} onChange={(e) => setOrganisation(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placemat-review">Review by</Label>
                  <Input id="placemat-review" type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placemat-prefs">Food preferences & notes</Label>
                  <Textarea
                    id="placemat-prefs" rows={4} value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="Likes, dislikes, allergies, cultural preferences…"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Utensils className="h-5 w-5" />Food level (3–7)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {PLACEMAT_FOOD_LEVELS.map((m) => (
                    <LevelButton key={m.key} meta={m} selected={foodKey === m.key} onSelect={() => setFoodKey(m.key)} />
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><CupSoda className="h-5 w-5" />Drink level (0–4)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {PLACEMAT_DRINK_LEVELS.map((m) => (
                    <LevelButton key={m.key} meta={m} selected={drinkKey === m.key} onSelect={() => setDrinkKey(m.key)} />
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. PIRATES strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pirates.map((p, i) => (
                  <div key={p.key} className="space-y-1.5">
                    <Label htmlFor={`pirates-${p.key}`} className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-md bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">{p.letter}</span>
                      {p.label}
                      <span className="text-xs font-normal text-muted-foreground">— {p.hint}</span>
                    </Label>
                    <Textarea
                      id={`pirates-${p.key}`} rows={2} value={p.value}
                      onChange={(e) => setPirates((prev) => prev.map((x, xi) => xi === i ? { ...x, value: e.target.value } : x))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">4. Equipment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...EQUIPMENT_OPTIONS, ...equipment])).map((item) => {
                    const on = equipment.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleEquipment(item)}
                        className={`px-3 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                          on ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {on && <Check className="h-3.5 w-3.5 inline mr-1" />}{item}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customEquipment} onChange={(e) => setCustomEquipment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEquipment())}
                    placeholder="Add custom equipment" className="h-11"
                  />
                  <Button onClick={addCustomEquipment} className="h-11"><Plus className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">5. IDDSI testing</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[{ label: 'Food testing', meta: food }, { label: 'Drink testing', meta: drink }].map(({ label, meta }) => (
                  <div key={label} className="rounded-xl border-2 p-3 space-y-2" style={{ borderColor: meta?.color ?? undefined }}>
                    <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
                    {meta ? (
                      <>
                        <p className="text-sm font-semibold">{meta.name}</p>
                        <ul className="text-sm list-disc pl-5 space-y-0.5">
                          {meta.tests.map((t) => <li key={t}>{t}</li>)}
                        </ul>
                        <p className="text-xs text-muted-foreground">{meta.particleSize}</p>
                        <a href={meta.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline break-all">
                          {meta.videoTitle}
                        </a>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a level in step 2 to auto-populate testing.</p>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Testing methods and both QR codes update automatically and independently when a level changes.
                </p>
              </CardContent>
            </Card>
          )}

          {step === 6 && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-lg">6. Print & share</CardTitle></CardHeader>
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
                  <div className="flex flex-wrap gap-2 pt-1">
                    {food && <Badge variant="secondary">Food QR → Level {food.level}</Badge>}
                    {drink && <Badge variant="secondary">Drink QR → Level {drink.level}</Badge>}
                  </div>
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
            </>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Button>
            <Button className="flex-1 h-11" disabled={step === 6} onClick={() => setStep((s) => s + 1)}>Next</Button>
          </div>
        </div>

        {/* ── Live preview ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground no-print">
            Live preview — A4 landscape
          </p>
          <PlacematPreview ref={sheetRef} data={data} />
        </div>
      </div>
    </div>
  );
}
