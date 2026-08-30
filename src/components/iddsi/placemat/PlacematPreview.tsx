/**
 * PlacematPreview — A4 landscape (1123 × 794 px @ 96dpi) mealtime placemat.
 * Rendered at fixed pixel size and scaled to fit on screen; printed 1:1.
 */

import { forwardRef, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  IddsiLevelMeta, PiratesItem, TEST_EQUIPMENT, PLACEMAT_DISCLAIMER,
} from './placematData';

export interface PlacematData {
  name: string;
  photoUrl?: string;
  food: IddsiLevelMeta | null;
  drink: IddsiLevelMeta | null;
  pirates: PiratesItem[];
  equipment: string[];
  preferences: string;
  /** Additional mealtime instructions from the IDDSI module */
  instructions?: string;
  organisation: string;
  reviewDate: string;
}

const SHEET_W = 1123;
const SHEET_H = 794;

const INK = '#1B1B22';
const SOFT = '#F6F6F8';
const LINE = '#DCDCE3';

function Panel({
  title, accent, children, style,
}: { title: string; accent?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        border: `1.5px solid ${LINE}`, borderRadius: 14, background: '#fff', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: SOFT, borderBottom: `1.5px solid ${LINE}` }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: accent ?? INK, border: `1px solid ${INK}22`, flexShrink: 0 }} />
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.1, color: INK, textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

function LevelCard({ kind, meta }: { kind: 'FOOD TEXTURE' | 'DRINK THICKNESS'; meta: IddsiLevelMeta | null }) {
  const accent = meta?.color ?? LINE;
  return (
    <div
      style={{
        flex: 1, borderRadius: 14, overflow: 'hidden', background: '#fff',
        border: `2px solid ${meta ? accent : LINE}`, display: 'flex', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          width: 96, background: accent, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 1,
          borderRight: `1.5px solid ${meta ? INK + '33' : LINE}`,
        }}
      >
        <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 1, color: meta?.onColor ?? '#71717a' }}>LEVEL</span>
        <span style={{ fontSize: 46, fontWeight: 900, lineHeight: 1, color: meta?.onColor ?? '#71717a' }}>{meta?.level ?? '–'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2, color: '#6B6B78' }}>{kind}</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: INK, lineHeight: 1.12, marginTop: 1 }}>
            {meta?.name ?? 'Not set'}
          </div>
          <div style={{ fontSize: 10, color: '#4B4B57', marginTop: 3, lineHeight: 1.25 }}>
            {meta?.descriptor ?? 'Set this level in the IDDSI module settings.'}
          </div>
        </div>
        {meta && (
          <img src={meta.image} alt={meta.name} style={{ height: 60, width: 84, objectFit: 'contain', flexShrink: 0 }} />
        )}
      </div>
    </div>
  );
}

function TestingBlock({
  title, meta, qrLabel,
}: { title: string; meta: IddsiLevelMeta | null; qrLabel: string }) {
  const equipment = meta
    ? Array.from(new Set(meta.tests.map((t) => TEST_EQUIPMENT[t]).filter(Boolean)))
    : [];
  return (
    <Panel title={title} accent={meta?.color} style={{ flex: 1 }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {meta ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {meta.tests.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 9.5, fontWeight: 700, color: INK, background: `${meta.color}33`,
                      border: `1px solid ${meta.color}`, borderRadius: 999, padding: '2px 7px',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 9.5, color: '#3f3f46', marginTop: 5, lineHeight: 1.3 }}>
                <strong>Requirement:</strong> {meta.particleSize}
              </div>
              {equipment.length > 0 && (
                <div style={{ fontSize: 9.5, color: '#3f3f46', marginTop: 2, lineHeight: 1.3 }}>
                  <strong>Test with:</strong> {equipment.join(' · ')}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 10.5, color: '#71717a' }}>Level not set in the IDDSI module.</div>
          )}
        </div>
        <div style={{ width: 92, textAlign: 'center', flexShrink: 0 }}>
          {meta ? (
            <>
              <div style={{ background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 8, padding: 3, display: 'inline-block' }}>
                <QRCodeSVG value={meta.videoUrl} size={72} level="M" includeMargin={false} />
              </div>
              <div style={{ fontSize: 7.5, fontWeight: 700, lineHeight: 1.15, marginTop: 2, color: INK }}>{qrLabel}</div>
            </>
          ) : (
            <div style={{ width: 72, height: 72, border: `1px dashed ${LINE}`, borderRadius: 8, margin: '0 auto' }} />
          )}
        </div>
      </div>
    </Panel>
  );
}

export const PlacematPreview = forwardRef<HTMLDivElement, { data: PlacematData }>(
  function PlacematPreview({ data }, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const update = () => setScale(Math.min(1, el.clientWidth / SHEET_W));
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const initials = data.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    return (
      <div ref={wrapRef} className="w-full">
        <div
          className="placemat-scale-wrapper"
          style={{ height: SHEET_H * scale, transform: `scale(${scale})`, transformOrigin: 'top left', width: SHEET_W }}
        >
          <div
            ref={ref}
            className="placemat-print-area"
            style={{
              width: SHEET_W, height: SHEET_H, background: '#fff', color: INK,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              padding: 18, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 9,
              border: `1px solid ${LINE}`,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px',
                borderRadius: 16, background: SOFT, border: `1.5px solid ${LINE}`,
              }}
            >
              <div
                style={{
                  width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: '#fff', border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {data.photoUrl
                  ? <img src={data.photoUrl} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 28, fontWeight: 800, color: '#9a9aa5' }}>{initials || '—'}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.4, color: '#6B6B78' }}>MEALTIME PLACEMAT</div>
                <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.03, letterSpacing: -0.5 }}>{data.name || 'Name'}</div>
                {data.organisation && <div style={{ fontSize: 11, color: '#6B6B78' }}>{data.organisation}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ label: 'FOOD', meta: data.food }, { label: 'DRINK', meta: data.drink }].map(({ label, meta }) => (
                  <div
                    key={label}
                    style={{
                      minWidth: 74, background: meta?.color ?? '#fff', color: meta?.onColor ?? '#9a9aa5',
                      borderRadius: 14, padding: '7px 12px', textAlign: 'center',
                      border: `2px solid ${meta ? INK : LINE}`,
                    }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.4 }}>{label}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{meta?.level ?? '–'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Levels */}
            <div style={{ display: 'flex', gap: 9, height: 96 }}>
              <LevelCard kind="FOOD TEXTURE" meta={data.food} />
              <LevelCard kind="DRINK THICKNESS" meta={data.drink} />
            </div>

            {/* Middle */}
            <div style={{ display: 'flex', gap: 9, flex: 1, minHeight: 0 }}>
              <Panel title="PIRATES mealtime strategies" style={{ flex: 1.6 }}>
                <div style={{ padding: '6px 9px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  {data.pirates.filter((p) => p.value.trim()).map((p) => (
                    <div key={p.key} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 19, height: 19, borderRadius: 6, background: INK, color: '#fff', fontSize: 11,
                          fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        {p.letter}
                      </div>
                      <div style={{ fontSize: 10, lineHeight: 1.3, flex: 1 }}>
                        <strong>{p.label}:</strong> {p.value}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
                <Panel title="Equipment required" style={{ flex: 1 }}>
                  <div style={{ padding: 7, display: 'flex', flexWrap: 'wrap', gap: 4, alignContent: 'flex-start' }}>
                    {data.equipment.length > 0 ? data.equipment.map((e) => (
                      <span
                        key={e}
                        style={{
                          fontSize: 9.5, fontWeight: 600, background: SOFT, border: `1px solid ${LINE}`,
                          borderRadius: 999, padding: '2px 8px',
                        }}
                      >
                        {e}
                      </span>
                    )) : <span style={{ fontSize: 10, color: '#71717a' }}>Set the IDDSI levels to list equipment</span>}
                  </div>
                </Panel>
                <Panel title="Food preferences & likes" style={{ flex: 1 }}>
                  <div style={{ padding: 7, fontSize: 10, lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
                    {data.preferences || <span style={{ color: '#9a9aa5' }}>No preferences recorded</span>}
                  </div>
                </Panel>
                {data.instructions?.trim() && (
                  <Panel title="Additional instructions" style={{ flex: 1 }}>
                    <div style={{ padding: 7, fontSize: 10, lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
                      {data.instructions}
                    </div>
                  </Panel>
                )}
              </div>
            </div>

            {/* Testing + QR codes */}
            <div style={{ display: 'flex', gap: 9, height: 132 }}>
              <TestingBlock title="Food testing method" meta={data.food} qrLabel="Scan to watch IDDSI Food Testing Method" />
              <TestingBlock title="Drink testing method" meta={data.drink} qrLabel="Scan to watch IDDSI Drink Testing Method" />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 7.5, color: '#6B6B78', lineHeight: 1.3, flex: 1 }}>
                {PLACEMAT_DISCLAIMER}
                <br />
                © The International Dysphagia Diet Standardisation Initiative 2019 · iddsi.org/standards/framework · CC BY-SA 4.0.
              </div>
              {data.reviewDate && (
                <div style={{ fontSize: 8, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>Review by: {data.reviewDate}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
