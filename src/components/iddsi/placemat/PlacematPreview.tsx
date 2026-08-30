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
  organisation: string;
  reviewDate: string;
}

const SHEET_W = 1123;
const SHEET_H = 794;

function LevelPanel({ heading, meta, fallback }: { heading: string; meta: IddsiLevelMeta | null; fallback: string }) {
  return (
    <div style={{ flex: 1, border: '2px solid #231F20', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ background: '#231F20', color: '#fff', padding: '5px 10px', fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>
        {heading}
      </div>
      {meta ? (
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ width: 74, background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid #231F20' }}>
            <span style={{ color: meta.onColor, fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{meta.level}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', flex: 1 }}>
            <img src={meta.image} alt={meta.name} style={{ height: 58, width: 90, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#231F20', lineHeight: 1.15 }}>{meta.name}</div>
              <div style={{ fontSize: 10.5, color: '#3f3f46', marginTop: 2, lineHeight: 1.25 }}>{meta.descriptor}</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#71717a' }}>{fallback}</div>
      )}
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
    <div style={{ flex: 1, border: `2px solid ${meta ? meta.color : '#d4d4d8'}`, borderRadius: 10, padding: 8, background: '#fff', display: 'flex', gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#231F20' }}>{title}</div>
        {meta ? (
          <>
            <ul style={{ margin: '4px 0 0', paddingLeft: 14, fontSize: 10.5, color: '#231F20', lineHeight: 1.35 }}>
              {meta.tests.map((t) => <li key={t} style={{ fontWeight: 600 }}>{t}</li>)}
            </ul>
            <div style={{ fontSize: 9.5, color: '#3f3f46', marginTop: 3, lineHeight: 1.3 }}>
              <strong>Requirement:</strong> {meta.particleSize}
            </div>
            {equipment.length > 0 && (
              <div style={{ fontSize: 9.5, color: '#3f3f46', marginTop: 2, lineHeight: 1.3 }}>
                <strong>Test with:</strong> {equipment.join(' · ')}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 10.5, color: '#71717a', marginTop: 6 }}>Select a level to show its testing method.</div>
        )}
      </div>
      <div style={{ width: 96, textAlign: 'center', flexShrink: 0 }}>
        {meta ? (
          <>
            <QRCodeSVG value={meta.videoUrl} size={78} level="M" includeMargin={false} />
            <div style={{ fontSize: 7.5, fontWeight: 700, lineHeight: 1.15, marginTop: 2, color: '#231F20' }}>{qrLabel}</div>
          </>
        ) : (
          <div style={{ width: 78, height: 78, border: '1px dashed #d4d4d8', borderRadius: 6, margin: '0 auto' }} />
        )}
      </div>
    </div>
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
              width: SHEET_W, height: SHEET_H, background: '#fff', color: '#231F20',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              padding: 16, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8,
              border: '1px solid #e4e4e7',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '3px solid #231F20', paddingBottom: 8 }}>
              <div style={{ width: 92, height: 92, borderRadius: 12, overflow: 'hidden', border: '3px solid #231F20', flexShrink: 0, background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {data.photoUrl
                  ? <img src={data.photoUrl} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 30, fontWeight: 800, color: '#71717a' }}>{initials || '—'}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#52525b' }}>MEALTIME PLACEMAT</div>
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.05 }}>{data.name || 'Name'}</div>
                {data.organisation && <div style={{ fontSize: 11, color: '#52525b' }}>{data.organisation}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {data.food && (
                  <div style={{ background: data.food.color, color: data.food.onColor, borderRadius: 10, padding: '6px 12px', textAlign: 'center', border: '2px solid #231F20' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>FOOD</div>
                    <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{data.food.level}</div>
                  </div>
                )}
                {data.drink && (
                  <div style={{ background: data.drink.color, color: data.drink.onColor, borderRadius: 10, padding: '6px 12px', textAlign: 'center', border: '2px solid #231F20' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>DRINK</div>
                    <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{data.drink.level}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Levels */}
            <div style={{ display: 'flex', gap: 8, height: 96 }}>
              <LevelPanel heading="FOOD TEXTURE" meta={data.food} fallback="No food level selected" />
              <LevelPanel heading="DRINK THICKNESS" meta={data.drink} fallback="No drink level selected" />
            </div>

            {/* Middle: PIRATES + equipment/preferences */}
            <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1.65, border: '2px solid #231F20', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#231F20', color: '#fff', padding: '4px 10px', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
                  PIRATES MEALTIME STRATEGIES
                </div>
                <div style={{ padding: '5px 8px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                  {data.pirates.filter((p) => p.value.trim()).map((p) => (
                    <div key={p.key} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <div style={{ width: 19, height: 19, borderRadius: 5, background: '#231F20', color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.letter}
                      </div>
                      <div style={{ fontSize: 10, lineHeight: 1.3, flex: 1 }}>
                        <strong>{p.label}:</strong> {p.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <div style={{ border: '2px solid #231F20', borderRadius: 10, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: '#231F20', color: '#fff', padding: '4px 10px', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>EQUIPMENT REQUIRED</div>
                  <div style={{ padding: 6, display: 'flex', flexWrap: 'wrap', gap: 4, alignContent: 'flex-start' }}>
                    {data.equipment.length > 0 ? data.equipment.map((e) => (
                      <span key={e} style={{ fontSize: 9.5, fontWeight: 600, background: '#f4f4f5', border: '1px solid #d4d4d8', borderRadius: 999, padding: '2px 7px' }}>{e}</span>
                    )) : <span style={{ fontSize: 10, color: '#71717a' }}>No equipment selected</span>}
                  </div>
                </div>
                <div style={{ border: '2px solid #231F20', borderRadius: 10, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: '#231F20', color: '#fff', padding: '4px 10px', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>FOOD PREFERENCES & NOTES</div>
                  <div style={{ padding: 6, fontSize: 10, lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
                    {data.preferences || <span style={{ color: '#71717a' }}>No preferences recorded</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Testing + QR codes */}
            <div style={{ display: 'flex', gap: 8, height: 132 }}>
              <TestingBlock title="Food testing method" meta={data.food} qrLabel="Scan to watch IDDSI Food Testing Method" />
              <TestingBlock title="Drink testing method" meta={data.drink} qrLabel="Scan to watch IDDSI Drink Testing Method" />
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #d4d4d8', paddingTop: 4, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 7.5, color: '#52525b', lineHeight: 1.3, flex: 1 }}>
                {PLACEMAT_DISCLAIMER}
                <br />
                © The International Dysphagia Diet Standardisation Initiative 2019 · iddsi.org/standards/framework · CC BY-SA 4.0.
              </div>
              {data.reviewDate && (
                <div style={{ fontSize: 8, fontWeight: 700, color: '#231F20', whiteSpace: 'nowrap' }}>Review by: {data.reviewDate}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
