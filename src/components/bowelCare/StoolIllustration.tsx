/**
 * Stool Illustration - SVG visual representations for Bristol stool types
 */

import { X } from 'lucide-react';

interface StoolIllustrationProps {
  type: number;
  className?: string;
}

export function StoolIllustration({ type, className = "w-full h-full" }: StoolIllustrationProps) {
  switch (type) {
    case 0:
      return (
        <div className="flex items-center justify-center w-full h-full">
          <X className="h-5 w-5 text-slate-400" />
        </div>
      );
    case 1:
      // Separate hard lumps
      return (
        <svg viewBox="0 0 60 30" className={className}>
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
        <svg viewBox="0 0 60 30" className={className}>
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
        <svg viewBox="0 0 60 30" className={className}>
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
        <svg viewBox="0 0 60 30" className={className}>
          <ellipse cx="30" cy="15" rx="26" ry="7" fill="#795548" />
          <ellipse cx="30" cy="13" rx="24" ry="4" fill="#8D6E63" opacity="0.5" />
        </svg>
      );
    case 5:
      // Soft blobs with clear-cut edges
      return (
        <svg viewBox="0 0 60 30" className={className}>
          <ellipse cx="12" cy="15" rx="8" ry="6" fill="#8D6E63" />
          <ellipse cx="30" cy="14" rx="9" ry="7" fill="#795548" />
          <ellipse cx="48" cy="16" rx="8" ry="6" fill="#8D6E63" />
        </svg>
      );
    case 6:
      // Mushy, fluffy pieces with ragged edges
      return (
        <svg viewBox="0 0 60 30" className={className}>
          <path d="M5 15 Q8 8 15 12 Q18 6 25 10 Q28 4 35 8" fill="#A1887F" />
          <path d="M10 20 Q15 15 22 18 Q28 12 35 16 Q42 10 50 14" fill="#8D6E63" />
          <path d="M15 25 Q22 20 30 23 Q38 18 45 22 Q52 17 55 20" fill="#795548" />
        </svg>
      );
    case 7:
      // Liquid consistency with no solid pieces
      return (
        <svg viewBox="0 0 60 30" className={className}>
          <ellipse cx="30" cy="18" rx="25" ry="8" fill="#A1887F" opacity="0.6" />
          <ellipse cx="28" cy="16" rx="20" ry="5" fill="#8D6E63" opacity="0.5" />
          <path d="M10 20 Q20 25 30 20 Q40 15 50 20" fill="#795548" opacity="0.4" />
        </svg>
      );
    default:
      return null;
  }
}
