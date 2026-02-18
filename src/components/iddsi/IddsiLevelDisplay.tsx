/**
 * IDDSI Level Display - Shows prescribed levels with testing info and videos
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useIddsiConfig, useVideoViews } from '@/hooks/useIddsi';
import { FOOD_LEVELS, DRINK_LEVELS, getFoodLevelKey, LevelInfo } from '@/types/iddsi';
import {
  ArrowLeft, ChevronDown, Play, CheckCircle2, FlaskConical, Video, AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  clientId?: string;
  onClose: () => void;
}

function LevelCard({
  info,
  levelType,
  levelValue,
  clientId,
}: {
  info: LevelInfo;
  levelType: 'food' | 'drink';
  levelValue: number;
  clientId?: string;
}) {
  const [testOpen, setTestOpen] = useState(false);
  const [videoConfirmed, setVideoConfirmed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [staffName, setStaffName] = useState('');
  const { logView, hasViewed } = useVideoViews(clientId);

  const handleWatchClick = () => {
    if (!hasViewed(levelType, levelValue)) {
      setShowNudge(true);
    } else {
      openVideo();
    }
  };

  const openVideo = () => {
    setShowNudge(false);
    if (info.videoUrl && staffName.trim()) {
      logView(levelType, levelValue, staffName.trim(), false);
      window.open(info.videoUrl.replace('/embed/', '/watch?v='), '_blank');
    }
  };

  const skipVideo = () => {
    if (staffName.trim()) {
      logView(levelType, levelValue, staffName.trim(), true);
    }
    setShowNudge(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-3">
          <img src={info.image} alt={info.name} className="h-12 w-12 object-contain" />
          <div>
            <span className="text-primary">{levelType === 'food' ? '🍽' : '🥤'} </span>
            {info.name}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground">{info.description}</p>

        {/* Texture Rules */}
        <div>
          <p className="text-sm font-medium mb-1">Key Texture Rules</p>
          <ul className="space-y-1">
            {info.textureRules.map((rule, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* How to Test - Expandable */}
        {info.testSteps.length > 0 && info.testSteps[0] !== 'Regular foods do not require IDDSI testing.' && (
          <Collapsible open={testOpen} onOpenChange={setTestOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" />
                  How to Test
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${testOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <p className="text-sm font-medium">{info.testSummary}</p>
              <ol className="space-y-2">
                {info.testSteps.map((step, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="font-medium text-foreground min-w-[20px]">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              {info.equipment.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-medium mb-1">Equipment Required</p>
                  <p className="text-xs text-muted-foreground">{info.equipment.join(', ')}</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Video Section */}
        {info.videoUrl && (
          <div className="space-y-2">
            <div>
              <Label htmlFor={`staff-${levelType}-${levelValue}`} className="text-xs">Your Name (for compliance log)</Label>
              <Input
                id={`staff-${levelType}-${levelValue}`}
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1"
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleWatchClick}
              disabled={!staffName.trim()}
            >
              <Play className="h-4 w-4 mr-2" />
              Watch Official Testing Video
            </Button>

            {hasViewed(levelType, levelValue) && (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                You have reviewed this testing method
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id={`confirm-${levelType}-${levelValue}`}
                checked={videoConfirmed}
                onCheckedChange={c => setVideoConfirmed(!!c)}
              />
              <label htmlFor={`confirm-${levelType}-${levelValue}`} className="text-xs text-muted-foreground cursor-pointer">
                Confirm I have reviewed this testing method
              </label>
            </div>
          </div>
        )}

        {/* Nudge Dialog */}
        <Dialog open={showNudge} onOpenChange={setShowNudge}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Review Testing Video
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              You have not previously reviewed the official IDDSI testing video for this level.
              Would you like to watch it now?
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={skipVideo}>Skip</Button>
              <Button onClick={openVideo}>Watch Now</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export function IddsiLevelDisplay({ clientId, onClose }: Props) {
  const { config, loading } = useIddsiConfig(clientId);

  const foodKey = config?.foodLevel !== null && config?.foodLevel !== undefined
    ? getFoodLevelKey(config.foodLevel, config.foodLevelVariant)
    : null;
  const foodInfo = foodKey ? FOOD_LEVELS[foodKey] : null;
  const drinkInfo = config?.drinkLevel !== null && config?.drinkLevel !== undefined
    ? DRINK_LEVELS[config.drinkLevel]
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Prescribed IDDSI Levels</h2>
      </div>

      {/* Safety note */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-3">
          <div className="flex gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              These levels are prescribed by a Speech Pathologist. Do not modify without clinical review.
            </p>
          </div>
        </CardContent>
      </Card>

      {!foodInfo && !drinkInfo && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No IDDSI levels have been configured yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Ask an Admin to set up prescribed levels in Settings.</p>
          </CardContent>
        </Card>
      )}

      {foodInfo && (
        <LevelCard
          info={foodInfo}
          levelType="food"
          levelValue={config!.foodLevel!}
          clientId={clientId}
        />
      )}

      {drinkInfo && (
        <LevelCard
          info={drinkInfo}
          levelType="drink"
          levelValue={config!.drinkLevel!}
          clientId={clientId}
        />
      )}
    </div>
  );
}
