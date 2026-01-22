/**
 * Bristol Stool Chart Selector - Visual picker for stool types
 * Based on the Bristol Stool Form Scale with clinical illustrations
 */

import { cn } from '@/lib/utils';
import { BRISTOL_TYPES } from '@/types/bowelCare';
import { Check, X } from 'lucide-react';

interface BristolSelectorProps {
  value: number | null;
  onChange: (type: number) => void;
  disabled?: boolean;
}

// SVG illustrations for each Bristol type
const StoolIllustration = ({ type }: { type: number }) => {
  const baseClass = "w-full h-full";
  
  switch (type) {
    case 0:
      return (
        <div className="flex items-center justify-center w-12 h-8">
          <X className="h-6 w-6 text-slate-400" />
        </div>
      );
    case 1:
      // Separate hard lumps
      return (
        <svg viewBox="0 0 60 30" className={baseClass}>
          <circle cx="10" cy="15" r="6" fill="#5D4037" />
          <circle cx="24" cy="12" r="5" fill="#6D4C41" />
          <circle cx="36" cy="18" r="6" fill="#5D4037" />
          <circle cx="48" cy="14" r="5" fill="#6D4C41" />
          <circle cx="17" cy="20" r="4" fill="#4E342E" />
        </svg>
      );
    case 2:
      // Sausage-shaped but lumpy
      return (
        <svg viewBox="0 0 60 30" className={baseClass}>
          <ellipse cx="30" cy="15" rx="26" ry="10" fill="#5D4037" />
          <circle cx="12" cy="12" r="4" fill="#6D4C41" />
          <circle cx="22" cy="18" r="5" fill="#6D4C41" />
          <circle cx="34" cy="13" r="4" fill="#6D4C41" />
          <circle cx="44" cy="16" r="5" fill="#6D4C41" />
        </svg>
      );
    case 3:
      // Sausage with cracks on surface
      return (
        <svg viewBox="0 0 60 30" className={baseClass}>
          <ellipse cx="30" cy="15" rx="26" ry="8" fill="#6D4C41" />
          <path d="M8 12 Q12 15 8 18" stroke="#4E342E" strokeWidth="1" fill="none" />
          <path d="M18 11 Q22 15 18 19" stroke="#4E342E" strokeWidth="1" fill="none" />
          <path d="M28 10 Q32 15 28 20" stroke="#4E342E" strokeWidth="1" fill="none" />
          <path d="M38 11 Q42 15 38 19" stroke="#4E342E" strokeWidth="1" fill="none" />
          <path d="M48 12 Q52 15 48 18" stroke="#4E342E" strokeWidth="1" fill="none" />
        </svg>
      );
    case 4:
      // Smooth and soft sausage or snake
      return (
        <svg viewBox="0 0 60 30" className={baseClass}>
          <ellipse cx="30" cy="15" rx="26" ry="7" fill="#795548" />
          <ellipse cx="30" cy="13" rx="24" ry="4" fill="#8D6E63" opacity="0.5" />
        </svg>
      );
    case 5:
      // Soft blobs with clear-cut edges
      return (
        <svg viewBox="0 0 60 30" className={baseClass}>
          <ellipse cx="12" cy="15" rx="8" ry="6" fill="#8D6E63" />
          <ellipse cx="30" cy="14" rx="9" ry="7" fill="#795548" />
          <ellipse cx="48" cy="16" rx="8" ry="6" fill="#8D6E63" />
        </svg>
      );
    case 6:
      // Mushy, fluffy pieces with ragged edges
      return (
        <svg viewBox="0 0 60 30" className={baseClass}>
          <path d="M5 15 Q8 8 15 12 Q18 6 25 10 Q28 4 35 8" fill="#A1887F" />
          <path d="M10 20 Q15 15 22 18 Q28 12 35 16 Q42 10 50 14" fill="#8D6E63" />
          <path d="M15 25 Q22 20 30 23 Q38 18 45 22 Q52 17 55 20" fill="#795548" />
        </svg>
      );
    case 7:
      // Liquid consistency with no solid pieces
      return (
        <svg viewBox="0 0 60 30" className={baseClass}>
          <ellipse cx="30" cy="18" rx="25" ry="8" fill="#A1887F" opacity="0.6" />
          <ellipse cx="28" cy="16" rx="20" ry="5" fill="#8D6E63" opacity="0.5" />
          <path d="M10 20 Q20 25 30 20 Q40 15 50 20" fill="#795548" opacity="0.4" />
        </svg>
      );
    default:
      return null;
  }
};

// Visual representations for each Bristol type
const BRISTOL_VISUALS: Record<number, { bgColor: string; textColor: string; status: string }> = {
  0: { bgColor: 'bg-slate-100', textColor: 'text-slate-600', status: 'No movement' },
  1: { bgColor: 'bg-red-100', textColor: 'text-red-700', status: 'Very constipated' },
  2: { bgColor: 'bg-orange-100', textColor: 'text-orange-700', status: 'Slightly constipated' },
  3: { bgColor: 'bg-green-100', textColor: 'text-green-700', status: 'Normal' },
  4: { bgColor: 'bg-green-100', textColor: 'text-green-700', status: 'Normal / Ideal' },
  5: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', status: 'Lack of fiber' },
  6: { bgColor: 'bg-orange-100', textColor: 'text-orange-700', status: 'Inflammation' },
  7: { bgColor: 'bg-red-100', textColor: 'text-red-700', status: 'Diarrhoea' },
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
        <div className="grid grid-cols-[70px_60px_1fr_100px] sm:grid-cols-[80px_80px_1fr_120px] bg-muted/50 border-b">
          <div className="p-2 text-xs font-semibold text-center border-r">Type</div>
          <div className="p-2 text-xs font-semibold text-center border-r">Image</div>
          <div className="p-2 text-xs font-semibold border-r">Description</div>
          <div className="p-2 text-xs font-semibold text-center">Status</div>
        </div>
        
        {/* Type 0 - Bowel not opened */}
        <button
          type="button"
          onClick={() => onChange(0)}
          disabled={disabled}
          className={cn(
            'w-full grid grid-cols-[70px_60px_1fr_100px] sm:grid-cols-[80px_80px_1fr_120px] border-b transition-all',
            'hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed',
            value === 0 && 'ring-2 ring-inset ring-primary bg-primary/5'
          )}
        >
          <div className="p-2 flex items-center justify-center border-r bg-slate-100">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold">Type 0</span>
              {value === 0 && <Check className="h-3 w-3 text-primary" />}
            </div>
          </div>
          <div className="p-2 flex items-center justify-center border-r bg-slate-50">
            <StoolIllustration type={0} />
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
                'w-full grid grid-cols-[70px_60px_1fr_100px] sm:grid-cols-[80px_80px_1fr_120px] border-b last:border-b-0 transition-all',
                'hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected && 'ring-2 ring-inset ring-primary bg-primary/5'
              )}
            >
              {/* Type number */}
              <div className={cn('p-2 flex flex-col items-center justify-center border-r', visual.bgColor)}>
                <span className="text-xs font-bold">Type {bristol.type}</span>
                {isSelected && <Check className="h-3 w-3 text-primary mt-0.5" />}
              </div>
              
              {/* Stool illustration */}
              <div className="p-2 flex items-center justify-center border-r bg-amber-50/50">
                <div className="w-14 h-8">
                  <StoolIllustration type={bristol.type} />
                </div>
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
