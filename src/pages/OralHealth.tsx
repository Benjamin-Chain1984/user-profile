/**
 * Oral Health Care Page - Module entry point
 */

import { OralHealthDashboard } from '@/components/oralHealth';

export default function OralHealthPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <OralHealthDashboard />
    </div>
  );
}
