/**
 * TrafficLightIcon — A realistic traffic light with three stacked circles.
 * The active status light glows; the others are dim.
 */

import { cn } from '@/lib/utils';
import type { TrafficLightStatus } from '@/types/trafficLight';

interface TrafficLightIconProps {
  status: TrafficLightStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { wrapper: 'w-6 h-[52px]', light: 'w-3.5 h-3.5', gap: 'gap-0.5', round: 'rounded-md', pad: 'p-[3px]' },
  md: { wrapper: 'w-9 h-[76px]', light: 'w-5 h-5', gap: 'gap-1', round: 'rounded-lg', pad: 'p-1.5' },
  lg: { wrapper: 'w-12 h-[100px]', light: 'w-7 h-7', gap: 'gap-1.5', round: 'rounded-xl', pad: 'p-2' },
};

export function TrafficLightIcon({ status, size = 'md', className }: TrafficLightIconProps) {
  const s = sizes[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-foreground/90 dark:bg-foreground/80 shrink-0',
        s.wrapper,
        s.gap,
        s.round,
        s.pad,
        className
      )}
    >
      {/* Red light */}
      <div
        className={cn(
          'rounded-full border border-black/20 transition-all',
          s.light,
          status === 'red'
            ? 'bg-destructive shadow-[0_0_8px_2px_hsl(var(--destructive)/0.6)]'
            : 'bg-destructive/20'
        )}
      />
      {/* Amber light */}
      <div
        className={cn(
          'rounded-full border border-black/20 transition-all',
          s.light,
          status === 'amber'
            ? 'bg-warning shadow-[0_0_8px_2px_hsl(var(--warning)/0.6)]'
            : 'bg-warning/20'
        )}
      />
      {/* Green light */}
      <div
        className={cn(
          'rounded-full border border-black/20 transition-all',
          s.light,
          status === 'green'
            ? 'bg-success shadow-[0_0_8px_2px_hsl(var(--success)/0.6)]'
            : 'bg-success/20'
        )}
      />
    </div>
  );
}
