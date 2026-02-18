/**
 * Positioning Check Panel - Informational inclinometer guide
 * Normalized 0–90° safe range with three-zone traffic-light display.
 * This is an informational tool only — no data is logged.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle2, AlertCircle, AlertTriangle, Info, Circle } from 'lucide-react';
import { useIddsiConfig } from '@/hooks/useIddsi';

interface Props {
  clientId?: string;
  onClose: () => void;
}

export function PositioningCheckPanel({ clientId, onClose }: Props) {
  const { config } = useIddsiConfig(clientId);
  const minSafeAngle = config?.minSafeAngle ?? 70;
  const targetSafeAngle = config?.targetSafeAngle ?? 80;

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
        const tilt = Math.round(Math.abs(event.beta));
        setRawAngle(Math.min(180, Math.max(0, tilt)));
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

  // Normalize angle: 0° = flat, 90° = upright, cap at 90°
  const rawValue = gyroSupported ? rawAngle : Number(manualAngle) || 0;
  const normalizedAngle = rawValue > 90 ? 180 - rawValue : rawValue;
  const cappedAngle = Math.min(90, Math.max(0, normalizedAngle));

  // Three-zone logic
  const getStatus = (angle: number) => {
    if (angle >= targetSafeAngle) return 'green' as const;
    if (angle >= minSafeAngle) return 'amber' as const;
    return 'red' as const;
  };

  const status = getStatus(cappedAngle);
  const allChecked = Object.values(checklist).every(Boolean);

  const statusConfig = {
    green: {
      icon: CheckCircle2,
      label: 'Safe Upright Position',
      borderClass: 'border-success bg-success/10',
      textClass: 'text-success',
      iconClass: 'text-success',
    },
    amber: {
      icon: AlertTriangle,
      label: 'Borderline – Adjust Upright',
      borderClass: 'border-amber-500 bg-amber-50',
      textClass: 'text-amber-600',
      iconClass: 'text-amber-500',
    },
    red: {
      icon: AlertCircle,
      label: 'Unsafe – Too Reclined',
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
                  {cappedAngle}°
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${currentStatus.iconClass}`} />
              <span className={`font-medium ${currentStatus.textClass}`}>{currentStatus.label}</span>
            </div>

            {/* Reference info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                Minimum required: {minSafeAngle}° · Target: 90°
              </p>
            </div>

            {/* Zone legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive" /> &lt;{minSafeAngle}°</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> {minSafeAngle}–{targetSafeAngle - 1}°</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success" /> ≥{targetSafeAngle}°</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist with tick icons */}
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

          {allChecked && status === 'green' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 mt-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">All positioning checks confirmed – Safe Position</span>
            </div>
          )}

          {allChecked && status === 'amber' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mt-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-600">Checklist confirmed – Adjust angle to ≥{targetSafeAngle}° for safe position</span>
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
