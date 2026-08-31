/** A4 landscape mealtime placemat with a touch-scroll mobile preview. */
import { forwardRef, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle, Armchair, ChevronLeft, ChevronRight, Clock, Droplets, Eye, Gauge,
  Heart, Mic, RotateCcw, ScanLine, Smile, Soup, TrendingDown, Users, Utensils,
  UtensilsCrossed, VolumeX, Wind,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IddsiLevelMeta, PiratesItem, TEST_EQUIPMENT, PLACEMAT_DISCLAIMER } from './placematData';

export interface PlacematData {
  name: string;
  photoUrl?: string;
  food: IddsiLevelMeta | null;
  drink: IddsiLevelMeta | null;
  pirates: PiratesItem[];
  equipment: string[];
  preferences: string;
  instructions?: string;
  organisation: string;
  reviewDate: string;
}

const SHEET_W = 1123;
const SHEET_H = 794;
const INK = '#18212B';
const MUTED_INK = '#53606C';
const SOFT = '#F3F6F8';
const LINE = '#CBD4DA';
const DANGER = '#B42318';
const DANGER_SOFT = '#FEF3F2';
const PLAN = '#E8F2F8';

const PIRATES_ICONS = {
  positioning: Armchair, implements: Utensils, rate: Gauge, alertness: Eye,
  texture: Soup, environment: VolumeX, supervision: Users,
};

const SYMPTOMS: { label: string; Icon: React.ElementType }[] = [
  { label: 'Coughing during meals', Icon: Wind },
  { label: 'Choking', Icon: AlertTriangle },
  { label: 'Wet, gurgly or hoarse voice', Icon: Mic },
  { label: 'Watery eyes or red face', Icon: Eye },
  { label: 'Not finishing meals', Icon: UtensilsCrossed },
  { label: 'Taking longer than usual to eat', Icon: Clock },
  { label: 'Chest infections', Icon: Heart },
  { label: 'Unexplained weight loss', Icon: TrendingDown },
  { label: 'Reflux or vomiting', Icon: RotateCcw },
  { label: 'Poor oral hygiene', Icon: Smile },
  { label: 'Drooling or trouble managing saliva', Icon: Droplets },
  { label: 'Shortness of breath during meals', Icon: Wind },
];

function Section({ title, children, accent = INK, style }: {
  title: string; children: React.ReactNode; accent?: string; style?: React.CSSProperties;
}) {
  return (
    <section style={{ border: `1.5px solid ${LINE}`, background: '#FFFFFF', display: 'flex', flexDirection: 'column', minHeight: 0, ...style }}>
      <div style={{ borderLeft: `7px solid ${accent}`, padding: '5px 9px', background: SOFT, borderBottom: `1px solid ${LINE}`, fontSize: 10.5, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function LevelBlock({ kind, meta }: { kind: 'FOOD' | 'DRINK'; meta: IddsiLevelMeta | null }) {
  const accent = meta?.color ?? LINE;
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '88px minmax(0,1fr) 76px', border: `2px solid ${accent}`, background: '#FFFFFF', minWidth: 0 }}>
      <div style={{ background: accent, color: meta?.onColor ?? MUTED_INK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 900 }}>{kind}</span>
        <span style={{ fontSize: 45, fontWeight: 950, lineHeight: .95 }}>{meta?.level ?? '–'}</span>
      </div>
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.05 }}>{meta?.name ?? 'Level not set'}</div>
        <div style={{ fontSize: 9.5, color: MUTED_INK, lineHeight: 1.25, marginTop: 4 }}>{meta?.descriptor ?? 'Configure this level in IDDSI Settings.'}</div>
      </div>
      {meta && <img src={meta.image} alt={`${meta.name} IDDSI symbol`} style={{ width: 70, height: 70, objectFit: 'contain', alignSelf: 'center' }} />}
    </div>
  );
}

function TestingCard({ kind, meta }: { kind: 'FOOD' | 'DRINK'; meta: IddsiLevelMeta | null }) {
  const equipment = meta ? Array.from(new Set(meta.tests.map((test) => TEST_EQUIPMENT[test]).filter(Boolean))) : [];
  return (
    <Section title={`${kind} testing`} accent={meta?.color} style={{ flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 104px', gap: 8, padding: 8, flex: 1 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 900, lineHeight: 1.15 }}>{meta?.videoTitle ?? 'Level not set'}</div>
          {meta && <>
            <div style={{ fontSize: 9, lineHeight: 1.28, marginTop: 5 }}><strong>Tests:</strong> {meta.tests.join(' · ')}</div>
            <div style={{ fontSize: 9, lineHeight: 1.28, marginTop: 4 }}><strong>Pass requirement:</strong> {meta.particleSize}</div>
            {equipment.length > 0 && <div style={{ fontSize: 8.5, color: MUTED_INK, lineHeight: 1.25, marginTop: 4 }}><strong>Use:</strong> {equipment.join(' · ')}</div>}
          </>}
        </div>
        <div style={{ textAlign: 'center', alignSelf: 'center' }}>
          {meta ? <>
            <div style={{ display: 'inline-flex', padding: 4, background: '#FFFFFF', border: `2px solid ${INK}` }}>
              <QRCodeSVG value={meta.videoUrl} size={88} level="H" includeMargin={false} />
            </div>
            <div style={{ fontSize: 7.5, fontWeight: 800, lineHeight: 1.15, marginTop: 3 }}>SCAN: {kind} TESTING VIDEO</div>
          </> : <div style={{ width: 96, height: 96, border: `1px dashed ${LINE}` }} />}
        </div>
      </div>
    </Section>
  );
}

function QrCheckCard({ kind, meta }: { kind: 'Food' | 'Drink'; meta: IddsiLevelMeta | null }) {
  return (
    <div className="rounded-md border bg-card p-4 text-center shadow-sm">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm font-bold"><ScanLine className="h-4 w-4" />{kind} testing QR</div>
      {meta ? <>
        <a href={meta.videoUrl} target="_blank" rel="noreferrer" className="inline-block rounded-md border-2 border-foreground bg-background p-2" aria-label={`Open ${kind.toLowerCase()} testing video`}>
          <QRCodeSVG value={meta.videoUrl} size={132} level="H" />
        </a>
        <p className="mt-2 text-sm font-semibold">Level {meta.level} · {meta.videoTitle}</p>
        <a href={meta.videoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-4">Open testing video</a>
      </> : <p className="text-sm text-muted-foreground">Set this level in IDDSI Settings.</p>}
    </div>
  );
}

export const PlacematPreview = forwardRef<HTMLDivElement, { data: PlacematData }>(
  function PlacematPreview({ data }, ref) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const initials = data.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    const scroll = (direction: number) => scrollRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });

    return <div className="w-full min-w-0 max-w-[calc(100vw-2rem)] lg:max-w-none">
      <div className="no-print mb-2 flex items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2">
        <p className="text-xs font-semibold">Swipe or use arrows to view the full A4 placemat</p>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => scroll(-1)} aria-label="Scroll placemat left"><ChevronLeft className="h-4 w-4" /></Button>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => scroll(1)} aria-label="Scroll placemat right"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div ref={scrollRef} className="placemat-preview-scroll block w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-md border bg-muted/30 pb-3" tabIndex={0} aria-label="Scrollable placemat preview">
        <div className="placemat-scale-wrapper" style={{ width: SHEET_W, minWidth: SHEET_W }}>
          <div ref={ref} className="placemat-print-area" style={{ width: SHEET_W, height: SHEET_H, overflow: 'hidden', background: '#FFFFFF', color: INK, fontFamily: 'Arial, sans-serif', padding: 16, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <header style={{ height: 90, display: 'flex', alignItems: 'center', gap: 13, borderBottom: `4px solid ${INK}`, paddingBottom: 7 }}>
              <div style={{ width: 76, height: 76, overflow: 'hidden', flexShrink: 0, border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: SOFT }}>
                {data.photoUrl ? <img src={data.photoUrl} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 27, fontWeight: 900 }}>{initials || '—'}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: MUTED_INK }}>MEALTIME PLACEMAT</div>
                <h1 style={{ fontSize: 33, fontWeight: 950, lineHeight: 1, margin: '3px 0 0' }}>{data.name || 'Person’s name'}</h1>
              </div>
              <div style={{ fontSize: 10, textAlign: 'right', lineHeight: 1.35 }}><strong>Review by</strong><br />{data.reviewDate || 'Not recorded'}</div>
            </header>

            <div style={{ minHeight: 37, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: PLAN, border: `2px solid ${INK}`, padding: '6px 14px', fontSize: 13.5, fontWeight: 900 }}>
              ALWAYS REFER TO {data.name ? `${data.name.toUpperCase()}’S` : 'THE PERSON’S'} CURRENT MEALTIME MANAGEMENT PLAN BEFORE PROVIDING FOOD OR DRINK
            </div>

            <div style={{ display: 'flex', gap: 8, height: 94 }}><LevelBlock kind="FOOD" meta={data.food} /><LevelBlock kind="DRINK" meta={data.drink} /></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 8, height: 190 }}>
              <Section title="Mealtime support — PIRATES">
                <div style={{ padding: '6px 8px', display: 'grid', gap: 3 }}>
                  {data.pirates.filter((item) => item.value.trim()).map((item) => {
                    const StrategyIcon = PIRATES_ICONS[item.key as keyof typeof PIRATES_ICONS];
                    return <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '21px 20px minmax(0,1fr)', gap: 4, alignItems: 'start' }}>
                    <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: INK, color: '#FFFFFF', fontSize: 10, fontWeight: 900 }}>{item.letter}</span>
                    <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{StrategyIcon && <StrategyIcon size={13} strokeWidth={2.4} />}</span>
                    <span style={{ fontSize: 9.2, lineHeight: 1.22 }}><strong>{item.label}:</strong> {item.value}</span>
                  </div>})}
                </div>
              </Section>
              <Section title="Signs and symptoms to watch out for" accent={DANGER}>
                <div style={{ padding: '5px 7px', fontSize: 8.6, lineHeight: 1.24 }}>
                  <div style={{ fontWeight: 900, color: DANGER, marginBottom: 5 }}>Seek advice from Speech Pathologist, escalate immediately.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
                    {SYMPTOMS.map(({ label, Icon }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon size={12} strokeWidth={2.2} color={DANGER} style={{ flexShrink: 0 }} />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 8, minHeight: 66 }}>
              <Section title="Equipment Needed for IDDSI Testing"><div style={{ padding: 7, display: 'flex', flexWrap: 'wrap', gap: 4, alignContent: 'flex-start' }}>{data.equipment.map((item) => <span key={item} style={{ padding: '2px 6px', background: SOFT, border: `1px solid ${LINE}`, fontSize: 8.5, fontWeight: 700 }}>{item}</span>)}</div></Section>
              <Section title="Food preferences & likes"><div style={{ padding: 7, fontSize: 10.5, lineHeight: 1.32, whiteSpace: 'pre-wrap' }}>{data.preferences || <span style={{ color: MUTED_INK }}>None recorded — add preferences in the panel below the preview.</span>}</div></Section>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.05fr', gap: 8, height: 190 }}>
              <TestingCard kind="FOOD" meta={data.food} />
              <TestingCard kind="DRINK" meta={data.drink} />
              <Section title="If signs or symptoms are observed" accent={DANGER}>
                <ol style={{ margin: 0, padding: '7px 8px 5px 25px', fontSize: 9.2, lineHeight: 1.27 }}>
                  <li style={{ marginBottom: 4 }}><strong>Stop food and drink.</strong> Stay with the person, keep them upright and follow their Mealtime Management Plan.</li>
                  <li style={{ marginBottom: 4 }}><strong>Choking / breathing emergency:</strong> call <strong>000</strong> and provide choking first aid within your training and workplace procedure.</li>
                  <li style={{ marginBottom: 4 }}><strong>If breathing:</strong> notify the supervisor/RN and seek urgent clinical advice as directed in the person’s plan.</li>
                  <li style={{ marginBottom: 4 }}><strong>Document and escalate:</strong> record the observation and complete an incident report.</li>
                  <li><strong>Clinical review:</strong> contact the person’s Speech Pathologist / treating team and review the plan before oral intake resumes.</li>
                </ol>
              </Section>
            </div>

            <footer style={{ minHeight: 34, display: 'flex', gap: 10, alignItems: 'flex-start', borderTop: `1px solid ${LINE}`, paddingTop: 5 }}>
              <div style={{ fontSize: 7.2, color: MUTED_INK, lineHeight: 1.23, flex: 1 }}>{PLACEMAT_DISCLAIMER}<br />© The International Dysphagia Diet Standardisation Initiative 2019 · iddsi.org/standards/framework · CC BY-SA 4.0.</div>
              <div style={{ padding: '3px 7px', background: DANGER_SOFT, color: DANGER, fontSize: 8, fontWeight: 900 }}>IF IN DOUBT: STOP AND CHECK THE PLAN</div>
            </footer>
          </div>
        </div>
      </div>

      <div className="no-print mt-4">
        <h3 className="mb-2 text-sm font-bold">Check testing QR codes on this phone</h3>
        <div className="grid gap-3 sm:grid-cols-2"><QrCheckCard kind="Food" meta={data.food} /><QrCheckCard kind="Drink" meta={data.drink} /></div>
      </div>
    </div>;
  }
);