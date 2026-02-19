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

      {/* Inclinometer */}
      <Card>
        <CardContent className="py-8">
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

            {/* Large angle display */}
            <div className={`flex items-center justify-center w-40 h-40 rounded-full border-4 ${currentStatus.borderClass}`}>
              <div className="text-center">
                <p className={`text-5xl font-bold ${currentStatus.textClass}`}>
                  {currentAngle}°
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getPositionLabel(currentAngle)}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${currentStatus.iconClass}`} />
              <span className={`font-medium ${currentStatus.textClass}`}>{isSafe ? '🟢' : '🔴'} {getStatusLabel()}</span>
            </div>

            {/* Reference info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                0° = Lying Flat · 90° = Fully Upright
              </p>
            </div>

            {/* Zone legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive" /> &lt;{safeLower}° Too Reclined</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success" /> {safeLower}°–{safeUpper}° Safe</span>
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
