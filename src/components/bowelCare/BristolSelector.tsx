/**
 * Bristol Stool Chart Selector - Visual picker for stool types
 */

import { cn } from '@/lib/utils';
import { BRISTOL_TYPES } from '@/types/bowelCare';
import { Check } from 'lucide-react';

interface BristolSelectorProps {
  value: number | null;
  onChange: (type: number) => void;
  disabled?: boolean;
}

export function BristolSelector({ value, onChange, disabled }: BristolSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select the stool type that best describes the bowel movement
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BRISTOL_TYPES.map((bristol) => {
          const isSelected = value === bristol.type;
          const isNoMovement = bristol.type === 0;
          const isConstipation = bristol.type >= 1 && bristol.type <= 2;
          const isNormal = bristol.type >= 3 && bristol.type <= 5;
          const isDiarrhoea = bristol.type >= 6 && bristol.type <= 7;

          return (
            <button
              key={bristol.type}
              type="button"
              onClick={() => onChange(bristol.type)}
              disabled={disabled}
              className={cn(
                'relative flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all',
                'hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected && 'ring-2 ring-offset-2',
                isNoMovement && (isSelected ? 'border-muted-foreground bg-muted/50 ring-muted-foreground' : 'border-muted hover:border-muted-foreground'),
                isConstipation && (isSelected ? 'border-amber-500 bg-amber-50 ring-amber-500' : 'border-amber-200 hover:border-amber-400'),
                isNormal && (isSelected ? 'border-green-500 bg-green-50 ring-green-500' : 'border-green-200 hover:border-green-400'),
                isDiarrhoea && (isSelected ? 'border-orange-500 bg-orange-50 ring-orange-500' : 'border-orange-200 hover:border-orange-400'),
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
                isNoMovement && 'bg-muted text-muted-foreground',
                isConstipation && 'bg-amber-100 text-amber-700',
                isNormal && 'bg-green-100 text-green-700',
                isDiarrhoea && 'bg-orange-100 text-orange-700',
              )}>
                {bristol.type === 0 ? '∅' : bristol.type}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{bristol.name}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{bristol.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span>Constipation indicator</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-400" />
          <span>Normal / Ideal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-400" />
          <span>Loose / Diarrhoea</span>
        </div>
      </div>
    </div>
  );
}
