/**
 * Positioning Check Panel - Inclinometer using device gyroscope
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { usePositioningChecks } from '@/hooks/useIddsi';
import { ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface Props {
  clientId?: string;
  onClose: () => void;
}

function getAngleStatus(angle: number): 'green' | 'amber' | 'red' {
  if (angle >= 80) return 'green';
  if (angle >= 70) return 'amber';
  return 'red';
}

export function PositioningCheckPanel({ clientId, onClose }: Props) {
  const { logCheck } = usePositioningChecks(clientId);
  const [angle, setAngle] = useState<number>(90);
  const [gyroSupported, setGyroSupported] = useState(true);
  const [manualAngle, setManualAngle] = useState('90');
  const [staffName, setStaffName] = useState('');
  const [checklist, setChecklist] = useState({
    personUpright: false,
    hipsAtBack: false,
    feetSupported: false,
    headMidline: false,
  });
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const listenerRef = useRef(false);

  useEffect(() => {
    if (listenerRef.current) return;
    listenerRef.current = true;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Beta gives front-to-back tilt in degrees (-180 to 180)
      if (event.beta !== null) {
        const tilt = Math.round(Math.abs(event.beta));
        setAngle(Math.min(180, Math.max(0, tilt)));
      }
    };

    if ('DeviceOrientationEvent' in window) {
      // iOS 13+ requires permission
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
        // Check if we get data within 2 seconds
        setTimeout(() => {
          // If angle hasn't changed from initial, likely no gyro
        }, 2000);
      }
    } else {
      setGyroSupported(false);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const currentAngle = gyroSupported ? angle : Number(manualAngle) || 0;
  const status = getAngleStatus(currentAngle);
  const allChecked = Object.values(checklist).every(Boolean);

  const handleConfirm = async () => {
    if (!staffName.trim()) return;
    setSaving(true);
    const ok = await logCheck({
      angle_degrees: currentAngle,
      person_upright: checklist.personUpright,
      hips_at_back: checklist.hipsAtBack,
      feet_supported: checklist.feetSupported,
      head_midline: checklist.headMidline,
      status,
      completed_by_name: staffName.trim(),
    });
    setSaving(false);
    if (ok) {
      setConfirmed(true);
      setTimeout(() => onClose(), 1500);
    }
  };

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <p className="text-lg font-semibold">Position Confirmed & Logged</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Check Positioning</h2>
      </div>

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
                  Gyroscope not available. Enter angle manually:
                </p>
                <Input
                  type="number"
                  min={0}
                  max={180}
                  value={manualAngle}
                  onChange={e => setManualAngle(e.target.value)}
                  className="text-center text-2xl font-bold h-14"
                />
              </div>
            )}

            {/* Large angle display */}
            <div className={`flex items-center justify-center w-40 h-40 rounded-full border-4 ${
              status === 'green' ? 'border-success bg-success/10' :
              status === 'amber' ? 'border-amber-500 bg-amber-50' :
              'border-destructive bg-destructive/10'
            }`}>
              <div className="text-center">
                <p className={`text-5xl font-bold ${
                  status === 'green' ? 'text-success' :
                  status === 'amber' ? 'text-amber-600' :
                  'text-destructive'
                }`}>
                  {currentAngle}°
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {status === 'green' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-medium text-success">Safe Position (≥80°)</span>
                </>
              ) : status === 'amber' ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-600">Adjust Position (70–79°)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">Unsafe Position (&lt;70°)</span>
                </>
              )}
            </div>

            {/* Zone legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive" /> &lt;70°</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> 70–79°</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success" /> ≥80°</span>
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
          {[
            { key: 'personUpright' as const, label: 'Person upright' },
            { key: 'hipsAtBack' as const, label: 'Hips at back of chair' },
            { key: 'feetSupported' as const, label: 'Feet supported' },
            { key: 'headMidline' as const, label: 'Head midline' },
          ].map(item => (
            <div key={item.key} className="flex items-center gap-3">
              <Checkbox
                id={item.key}
                checked={checklist[item.key]}
                onCheckedChange={c => setChecklist(prev => ({ ...prev, [item.key]: !!c }))}
              />
              <label htmlFor={item.key} className="text-sm font-medium cursor-pointer">
                {item.label}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Staff Name */}
      <div>
        <Label htmlFor="pos-staff">Your Name *</Label>
        <Input
          id="pos-staff"
          value={staffName}
          onChange={e => setStaffName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      {/* Confirm */}
      <Button
        onClick={handleConfirm}
        disabled={!allChecked || !staffName.trim() || saving}
        className="w-full"
        size="lg"
      >
        {saving ? 'Saving...' : '✔ Confirm Safe Position'}
      </Button>
    </div>
  );
}
