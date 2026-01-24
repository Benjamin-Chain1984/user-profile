/**
 * Bristol Stool Chart Selector - Interactive button-based picker for stool types
 * Based on the Bristol Stool Form Scale with clinical illustrations
 * UI-only update: No changes to clinical logic, alerts, or data models
 */

import { cn } from '@/lib/utils';
import { BRISTOL_TYPES } from '@/types/bowelCare';
import { Check, X } from 'lucide-react';
import { StoolIllustration } from './StoolIllustration';

interface BristolSelectorProps {
  value: number | null;
  onChange: (type: number) => void;
  disabled?: boolean;
}

// Visual representations for each Bristol type with clinical color coding
const BRISTOL_VISUALS: Record<number, { 
  bgColor: string; 
  bgColorSelected: string;
  borderColor: string;
  textColor: string; 
  status: string;
  shortDesc: string;
}> = {
  0: { 
    bgColor: 'bg-slate-50 hover:bg-slate-100', 
    bgColorSelected: 'bg-slate-200',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-700', 
    status: 'No movement',
    shortDesc: 'No bowel movement'
  },
  1: { 
    bgColor: 'bg-red-50 hover:bg-red-100', 
    bgColorSelected: 'bg-red-200',
    borderColor: 'border-red-400',
    textColor: 'text-red-800', 
    status: 'Very constipated',
    shortDesc: 'Hard pellets'
  },
  2: { 
    bgColor: 'bg-orange-50 hover:bg-orange-100', 
    bgColorSelected: 'bg-orange-200',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-800', 
    status: 'Slightly constipated',
    shortDesc: 'Lumpy sausage'
  },
  3: { 
    bgColor: 'bg-green-50 hover:bg-green-100', 
    bgColorSelected: 'bg-green-200',
    borderColor: 'border-green-500',
    textColor: 'text-green-800', 
    status: 'Normal',
    shortDesc: 'Cracked sausage'
  },
  4: { 
    bgColor: 'bg-green-50 hover:bg-green-100', 
    bgColorSelected: 'bg-green-200',
    borderColor: 'border-green-500',
    textColor: 'text-green-800', 
    status: 'Ideal',
    shortDesc: 'Smooth sausage'
  },
  5: { 
    bgColor: 'bg-yellow-50 hover:bg-yellow-100', 
    bgColorSelected: 'bg-yellow-200',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800', 
    status: 'Lack of fiber',
    shortDesc: 'Soft blobs'
  },
  6: { 
    bgColor: 'bg-orange-50 hover:bg-orange-100', 
    bgColorSelected: 'bg-orange-200',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-800', 
    status: 'Inflammation',
    shortDesc: 'Fluffy pieces'
  },
  7: { 
    bgColor: 'bg-red-50 hover:bg-red-100', 
    bgColorSelected: 'bg-red-200',
    borderColor: 'border-red-400',
    textColor: 'text-red-800', 
    status: 'Diarrhoea',
    shortDesc: 'Watery'
  },
};

export function BristolSelector({ value, onChange, disabled }: BristolSelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tap to select the stool type that best describes the bowel movement
      </p>
      
      {/* Type 0 - No bowel movement (separate prominent button) */}
      <button
        type="button"
        onClick={() => onChange(0)}
        disabled={disabled}
        aria-label="Type 0: No bowel movement"
        aria-pressed={value === 0}
        className={cn(
          'w-full p-4 rounded-xl border-2 transition-all duration-200',
          'flex items-center justify-between gap-4',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'touch-manipulation select-none',
          value === 0 
            ? cn(BRISTOL_VISUALS[0].bgColorSelected, BRISTOL_VISUALS[0].borderColor, 'ring-2 ring-primary')
            : cn(BRISTOL_VISUALS[0].bgColor, 'border-slate-200')
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <X className="w-6 h-6 text-slate-500" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-base">Type 0</div>
            <div className="text-sm text-muted-foreground">Bowel not opened</div>
          </div>
        </div>
        {value === 0 && (
          <div className="flex-shrink-0">
            <Check className="w-6 h-6 text-primary" />
          </div>
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Bristol Stool Types</span>
        </div>
      </div>

      {/* Types 1-7 Button Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BRISTOL_TYPES.filter(b => b.type > 0).map((bristol) => {
          const visual = BRISTOL_VISUALS[bristol.type];
          const isSelected = value === bristol.type;
          
          return (
            <button
              key={bristol.type}
              type="button"
              onClick={() => onChange(bristol.type)}
              disabled={disabled}
              aria-label={`Type ${bristol.type}: ${bristol.name}. ${bristol.description}`}
              aria-pressed={isSelected}
              className={cn(
                'relative p-3 rounded-xl border-2 transition-all duration-200',
                'flex items-center gap-3',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'touch-manipulation select-none',
                'min-h-[80px]',
                isSelected 
                  ? cn(visual.bgColorSelected, visual.borderColor, 'ring-2 ring-primary shadow-md')
                  : cn(visual.bgColor, 'border-muted')
              )}
            >
              {/* Stool Illustration */}
              <div className="w-14 h-10 flex-shrink-0 bg-amber-50/80 rounded-lg p-1 flex items-center justify-center">
                <StoolIllustration type={bristol.type} />
              </div>
              
              {/* Type Info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', visual.bgColorSelected, visual.textColor)}>
                    Type {bristol.type}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </div>
                <div className="font-medium text-sm mt-1 truncate">{bristol.name}</div>
                <div className={cn('text-xs font-medium mt-0.5', visual.textColor)}>
                  {visual.status}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Color Legend */}
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
