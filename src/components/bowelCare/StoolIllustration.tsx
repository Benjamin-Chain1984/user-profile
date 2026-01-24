/**
 * Stool Illustration - PNG images for Bristol stool types
 */

import { X } from 'lucide-react';

interface StoolIllustrationProps {
  type: number;
  className?: string;
}

const STOOL_IMAGES: Record<number, string> = {
  1: '/Type 1.PNG',
  2: '/Type 2.PNG',
  3: '/Type 3.PNG',
  4: '/Type 4.PNG',
  5: '/Type 5.PNG',
  6: '/Type 6.PNG',
  7: '/Type 7.PNG',
};

export function StoolIllustration({ type, className = "w-full h-full" }: StoolIllustrationProps) {
  if (type === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <X className="h-5 w-5 text-slate-400" />
      </div>
    );
  }

  const imageSrc = STOOL_IMAGES[type];
  if (!imageSrc) return null;

  return (
    <img 
      src={imageSrc} 
      alt={`Bristol Stool Type ${type}`}
      className={className}
      loading="lazy"
    />
  );
}
