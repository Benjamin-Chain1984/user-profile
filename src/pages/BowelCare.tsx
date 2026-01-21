/**
 * Bowel Care Page - Module entry point
 */

import { BowelCareDashboard } from '@/components/bowelCare';

// For demo purposes, not filtering by client
// In production, this would come from route params or context
export default function BowelCarePage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <BowelCareDashboard />
    </div>
  );
}
