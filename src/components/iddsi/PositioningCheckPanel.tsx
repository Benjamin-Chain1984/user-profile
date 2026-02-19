/**
 * Positioning Check Panel - Binary Safe/Unsafe inclinometer
 * Full 0–180° range. Safety = proximity to 90° (upright).
 * No amber. No clamping.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle2, AlertCircle, Info, Circle } from 'lucide-react';
import { useIddsiConfig } from '@/hooks/useIddsi';

interface Props {
  clientId?: string;
  onClose: () => void;
}

export function PositioningCheckPanel({ clientId, onClose }: Props) {
  const { config } = useIddsiConfig(clientId);
  const safeLower = config?.minSafeAngle ?? 70;
  const safeUpper = config?.targetSafeAngle ?? 90;

  const [rawAngle, setRawAngle] = useState<number>(90);
  const [gyroSupported, setGyroSupported] = useState(true);
  const [manualAngle, setManualAngle] = useState('90');
  const [checklist, setChecklist] = useState({
    personUpright: false,
    hipsAtBack: false,
    feetSupported: false,
    headMidline: false,
    remainUpright: false,
  });
  const listenerRef = useRef(false);

  useEffect(() => {
    if (listenerRef.current) return;
    listenerRef.current = true;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null) {
        // 0–90 range: 0 = lying flat, 90 = upright
        const tilt = Math.round(Math.abs(event.beta));
        setRawAngle(Math.min(90, Math.max(0, tilt)));
      }
    };

    if ('DeviceOrientationEvent' in window) {
      const requestPermission = (DeviceOrientationEvent as any).requestPermission;
      if (typeof requestPermission === 'function') {
        requestPermission().then((state: string) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          } else {
            setGyroSupported(false);
          }
        }).catch(() => setGyroSupported(false));
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    } else {
      setGyroSupported(false);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const currentAngle = gyroSupported ? rawAngle : Number(manualAngle) || 0;

  // Binary safety: within safe range = green, outside = red
  const isSafe = currentAngle >= safeLower && currentAngle <= safeUpper;
  const status = isSafe ? 'green' : 'red';

  // Position descriptor
  const getPositionLabel = (angle: number) => {
    if (angle >= safeLower && angle <= safeUpper) return 'Upright';
    if (angle < safeLower) return 'Too Reclined';
    return 'Past Upright';
  };

  const getStatusLabel = () => {
    if (isSafe) return `SAFE – Within Safe Range (${safeLower}°–${safeUpper}°)`;
    return 'UNSAFE – Adjust Position';
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const statusConfig = {
    green: {
      icon: CheckCircle2,
      borderClass: 'border-success bg-success/10',
      textClass: 'text-success',
      iconClass: 'text-success',
    },
    red: {
      icon: AlertCircle,
      borderClass: 'border-destructive bg-destructive/10',
      textClass: 'text-destructive',
      iconClass: 'text-destructive',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  const checklistItems = [
    { key: 'personUpright' as const, label: 'Person upright' },
    { key: 'hipsAtBack' as const, label: 'Hips at back of chair' },
    { key: 'feetSupported' as const, label: 'Feet supported' },
    { key: 'headMidline' as const, label: 'Head midline' },
    { key: 'remainUpright' as const, label: 'Remain upright 30 mins post meal' },
  ];

  const canConfirm = isSafe && allChecked;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Check Positioning</h2>
      </div>

      {/* Informational banner */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-3">
          <div className="flex gap-3">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              This is an informational guide to help staff check positioning before meals. No data is recorded.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inclinometer with Protractor */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center space-y-4">
            {gyroSupported ? (
              <p className="text-sm text-muted-foreground text-center">
                Hold device against person's torso or chair back
              </p>
            ) : (
              <div className="space-y-2 w-full">
                 <p className="text-sm text-muted-foreground text-center">
                   Gyroscope not available. Enter angle manually (0–90°):
                 </p>
                 <Input
                   type="number"
                   min={0}
                   max={90}
                  value={manualAngle}
                  onChange={e => setManualAngle(e.target.value)}
                  className="text-center text-2xl font-bold h-14"
                />
              </div>
            )}

            {/* Protractor with wheelchair */}
            {(() => {
              const cx = 150, cy = 160, r = 120;
              const posFromArcT = (t: number) => {
                const svgAngle = Math.PI - t * Math.PI;
                return { x: cx + r * Math.cos(svgAngle), y: cy - r * Math.sin(svgAngle) };
              };
              const leftDegToT = (deg: number) => (deg / 90) * 0.5;
              const rightDegToT = (deg: number) => 0.5 + ((90 - deg) / 90) * 0.5;
              const arcPath = (t1: number, t2: number) => {
                const s = posFromArcT(t1);
                const e = posFromArcT(t2);
                const angleSweep = (t2 - t1) * 180;
                const largeArc = angleSweep > 180 ? 1 : 0;
                return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
              };

              const ticks: { t: number; label: string; isMajor: boolean }[] = [];
              for (let d = 0; d <= 90; d += 10) {
                const isMajor = d % 30 === 0 || d === 90;
                ticks.push({ t: leftDegToT(d), label: `${d}°`, isMajor });
              }
              for (let d = 80; d >= 0; d -= 10) {
                const isMajor = d % 30 === 0;
                ticks.push({ t: rightDegToT(d), label: `${d}°`, isMajor });
              }

              const lo = Math.max(0, Math.min(90, safeLower));
              const hi = Math.max(0, Math.min(90, safeUpper));
              const loT = leftDegToT(lo);
              const hiT = leftDegToT(hi);
              const hiTR = rightDegToT(hi);
              const loTR = rightDegToT(lo);

              // Needle position: map currentAngle (0-90) to left side of arc
              const needleT = leftDegToT(Math.max(0, Math.min(90, currentAngle)));
              const needlePos = posFromArcT(needleT);

              return (
                <div className="flex justify-center w-full">
                  <svg viewBox="0 0 300 200" className="w-full max-w-sm">
                    {/* Background arc */}
                    <path d={arcPath(0, 1)} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity="0.4" />

                    {/* Left danger (0 to lo) */}
                    <path d={arcPath(0, loT)} fill="none" stroke="hsl(var(--destructive))" strokeWidth="18" strokeLinecap="butt" opacity="0.25" />
                    {/* Left safe (lo to hi) */}
                    <path d={arcPath(loT, hiT)} fill="none" stroke="hsl(var(--success))" strokeWidth="18" strokeLinecap="butt" opacity="0.35" />
                    {/* Top safe (hi left to hi right) */}
                    <path d={arcPath(hiT, hiTR)} fill="none" stroke="hsl(var(--success))" strokeWidth="18" strokeLinecap="butt" opacity="0.35" />
                    {/* Right safe (hi mirror to lo mirror) */}
                    <path d={arcPath(hiTR, loTR)} fill="none" stroke="hsl(var(--success))" strokeWidth="18" strokeLinecap="butt" opacity="0.35" />
                    {/* Right danger (lo mirror to edge) */}
                    <path d={arcPath(loTR, 1)} fill="none" stroke="hsl(var(--destructive))" strokeWidth="18" strokeLinecap="butt" opacity="0.25" />

                    {/* Tick marks */}
                    {ticks.map((tick, i) => {
                      const inner = tick.isMajor ? r - 12 : r - 7;
                      const outer = r + 2;
                      const svgAngle = Math.PI - tick.t * Math.PI;
                      const x1 = cx + inner * Math.cos(svgAngle), y1 = cy - inner * Math.sin(svgAngle);
                      const x2 = cx + outer * Math.cos(svgAngle), y2 = cy - outer * Math.sin(svgAngle);
                      const lx = cx + (r + 15) * Math.cos(svgAngle), ly = cy - (r + 15) * Math.sin(svgAngle);
                      return (
                        <g key={i}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="hsl(var(--foreground))" strokeWidth={tick.isMajor ? 1.2 : 0.6} opacity={tick.isMajor ? 0.5 : 0.25}
                          />
                          {tick.isMajor && (
                            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="hsl(var(--muted-foreground))" fontWeight="500">
                              {tick.label}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* 90° Upright label */}
                    <text x={cx} y={cy - r - 20} textAnchor="middle" fontSize="8" fill="hsl(var(--foreground))" fontWeight="600">
                      90° Upright
                    </text>

                    {/* Left 0° label */}
                    <text x={28} y={cy + 12} textAnchor="middle" fontSize="7" fill="hsl(var(--destructive))" fontWeight="600">
                      0° Flat
                    </text>
                    {/* Right 0° label */}
                    <text x={272} y={cy + 12} textAnchor="middle" fontSize="7" fill="hsl(var(--destructive))" fontWeight="600">
                      0° Flat
                    </text>

                    {/* Wheelchair silhouette at center */}
                    <g transform={`translate(${cx}, ${cy - 8})`} opacity="0.15">
                      {/* Head */}
                      <circle cx="0" cy="-52" r="8" fill="hsl(var(--foreground))" />
                      {/* Body/torso */}
                      <line x1="0" y1="-44" x2="0" y2="-16" stroke="hsl(var(--foreground))" strokeWidth="4" strokeLinecap="round" />
                      {/* Arms */}
                      <line x1="0" y1="-36" x2="-14" y2="-26" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
                      <line x1="0" y1="-36" x2="14" y2="-26" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
                      {/* Lap/legs */}
                      <line x1="0" y1="-16" x2="16" y2="-16" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
                      <line x1="16" y1="-16" x2="16" y2="0" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
                      {/* Rear wheel */}
                      <circle cx="-4" cy="6" r="18" fill="none" stroke="hsl(var(--foreground))" strokeWidth="3" />
                      <circle cx="-4" cy="6" r="3" fill="hsl(var(--foreground))" />
                      {/* Front wheel */}
                      <circle cx="20" cy="6" r="7" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
                      {/* Backrest */}
                      <line x1="-12" y1="-44" x2="-12" y2="-10" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
                      {/* Handle */}
                      <line x1="-12" y1="-44" x2="-20" y2="-50" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
                    </g>

                    {/* Needle */}
                    <line
                      x1={cx} y1={cy}
                      x2={needlePos.x} y2={needlePos.y}
                      stroke={isSafe ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Needle center dot */}
                    <circle cx={cx} cy={cy} r="5" fill={isSafe ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} stroke="white" strokeWidth="2" />
                    {/* Needle tip dot */}
                    <circle cx={needlePos.x} cy={needlePos.y} r="4" fill={isSafe ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} stroke="white" strokeWidth="1.5" />

                    {/* Base line */}
                    <line x1={cx - r - 5} y1={cy} x2={cx + r + 5} y2={cy} stroke="hsl(var(--border))" strokeWidth="1" />

                    {/* Angle readout */}
                    <text x={cx} y={cy - 28} textAnchor="middle" fontSize="22" fontWeight="700"
                      fill={isSafe ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}>
                      {currentAngle}°
                    </text>
                    <text x={cx} y={cy - 14} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
                      {getPositionLabel(currentAngle)}
                    </text>
                  </svg>
                </div>
              );
            })()}

            {/* Status */}
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${currentStatus.iconClass}`} />
              <span className={`font-medium ${currentStatus.textClass}`}>{isSafe ? '🟢' : '🔴'} {getStatusLabel()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Positioning Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklistItems.map(item => (
            <button
              key={item.key}
              onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
              className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {checklist[item.key] ? (
                <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground/40 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium ${checklist[item.key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </button>
          ))}

          {/* Confirm Safe Position button */}
          {allChecked && isSafe && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 mt-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">✔ Confirm Safe Position – All checks passed</span>
            </div>
          )}

          {allChecked && !isSafe && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Position must be adjusted before continuing.</span>
            </div>
          )}

          {!allChecked && !isSafe && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Position must be adjusted before continuing.</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={onClose} variant="outline" className="w-full" size="lg">
        Done
      </Button>
    </div>
  );
}
