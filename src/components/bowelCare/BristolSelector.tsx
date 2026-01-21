/**
 * Bristol Stool Chart Selector - Visual picker for stool types
 * Based on the Bristol Stool Form Scale
 */

import { cn } from '@/lib/utils';
import { BRISTOL_TYPES } from '@/types/bowelCare';
import { Check, X } from 'lucide-react';

interface BristolSelectorProps {
  value: number | null;
  onChange: (type: number) => void;
  disabled?: boolean;
}

// Visual representations for each Bristol type
const BRISTOL_VISUALS: Record<number, { emoji: string; bgColor: string; textColor: string; status: string }> = {
  0: { emoji: '⊘', bgColor: 'bg-slate-100', textColor: 'text-slate-600', status: 'No movement' },
  1: { emoji: '●●●', bgColor: 'bg-red-100', textColor: 'text-red-700', status: 'Very constipated' },
  2: { emoji: '⬮⬮', bgColor: 'bg-orange-100', textColor: 'text-orange-700', status: 'Slightly constipated' },
  3: { emoji: '▬▬', bgColor: 'bg-green-100', textColor: 'text-green-700', status: 'Normal' },
  4: { emoji: '━━', bgColor: 'bg-green-100', textColor: 'text-green-700', status: 'Normal / Ideal' },
  5: { emoji: '◐◐', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', status: 'Lack of fiber' },
  6: { emoji: '☁☁', bgColor: 'bg-orange-100', textColor: 'text-orange-700', status: 'Inflammation' },
  7: { emoji: '💧', bgColor: 'bg-red-100', textColor: 'text-red-700', status: 'Diarrhoea' },
};

export function BristolSelector({ value, onChange, disabled }: BristolSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select the stool type that best describes the bowel movement
      </p>
      
      {/* Visual Bristol Chart Table */}
      <div className="border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[60px_1fr_100px] sm:grid-cols-[70px_1fr_120px] bg-muted/50 border-b">
          <div className="p-2 text-xs font-semibold text-center border-r">Type</div>
          <div className="p-2 text-xs font-semibold border-r">Description</div>
          <div className="p-2 text-xs font-semibold text-center">Status</div>
        </div>
        
        {/* Type 0 - Bowel not opened */}
        <button
          type="button"
          onClick={() => onChange(0)}
          disabled={disabled}
          className={cn(
            'w-full grid grid-cols-[60px_1fr_100px] sm:grid-cols-[70px_1fr_120px] border-b transition-all',
            'hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed',
            value === 0 && 'ring-2 ring-inset ring-primary bg-primary/5'
          )}
        >
          <div className="p-2 flex items-center justify-center border-r bg-slate-100">
            <div className="flex items-center gap-1">
              <X className="h-4 w-4 text-slate-500" />
              {value === 0 && <Check className="h-3 w-3 text-primary" />}
            </div>
          </div>
          <div className="p-2 text-left border-r">
            <div className="font-medium text-sm">Bowel not opened</div>
            <div className="text-xs text-muted-foreground">No bowel movement recorded</div>
          </div>
          <div className={cn('p-2 flex items-center justify-center text-xs font-medium', BRISTOL_VISUALS[0].bgColor, BRISTOL_VISUALS[0].textColor)}>
            No movement
          </div>
        </button>
        
        {/* Types 1-7 */}
        {BRISTOL_TYPES.filter(b => b.type > 0).map((bristol) => {
          const visual = BRISTOL_VISUALS[bristol.type];
          const isSelected = value === bristol.type;
          
          return (
            <button
              key={bristol.type}
              type="button"
              onClick={() => onChange(bristol.type)}
              disabled={disabled}
              className={cn(
                'w-full grid grid-cols-[60px_1fr_100px] sm:grid-cols-[70px_1fr_120px] border-b last:border-b-0 transition-all',
                'hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected && 'ring-2 ring-inset ring-primary bg-primary/5'
              )}
            >
              {/* Type number with visual */}
              <div className={cn('p-2 flex flex-col items-center justify-center border-r', visual.bgColor)}>
                <span className="text-xs font-bold">Type {bristol.type}</span>
                <span className="text-lg leading-none mt-0.5">{visual.emoji}</span>
                {isSelected && <Check className="h-3 w-3 text-primary mt-0.5" />}
              </div>
              
              {/* Description */}
              <div className="p-2 text-left border-r flex flex-col justify-center">
                <div className="font-medium text-sm">{bristol.name}</div>
                <div className="text-xs text-muted-foreground">{bristol.description}</div>
              </div>
              
              {/* Status indicator */}
              <div className={cn('p-2 flex items-center justify-center text-xs font-medium text-center', visual.bgColor, visual.textColor)}>
                {visual.status}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span>Constipation / Diarrhoea</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-400" />
          <span>Monitor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-400" />
          <span>Normal / Ideal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-400" />
          <span>Fiber needed</span>
        </div>
      </div>
    </div>
  );
}
