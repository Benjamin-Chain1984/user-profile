/**
 * Stool Size Selector - Visual picker with everyday references
 */

import { cn } from '@/lib/utils';
import { STOOL_SIZES } from '@/types/bowelCare';
import { Check } from 'lucide-react';

interface StoolSizeSelectorProps {
  value: string | null;
  onChange: (size: string) => void;
  disabled?: boolean;
}

export function StoolSizeSelector({ value, onChange, disabled }: StoolSizeSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Approximate size of the bowel movement
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STOOL_SIZES.map((size) => {
          const isSelected = value === size.value;

          return (
            <button
              key={size.value}
              type="button"
              onClick={() => onChange(size.value)}
              disabled={disabled}
              className={cn(
                'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all',
                'hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <span className="text-2xl">{size.icon}</span>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <span className="font-medium text-sm">{size.label}</span>
                  {isSelected && <Check className="h-3 w-3 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{size.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
