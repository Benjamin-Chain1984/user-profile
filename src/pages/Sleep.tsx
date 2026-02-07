/**
 * Sleep Chart Page - Module entry point
 */

import { SleepDashboard } from '@/components/sleep';

export default function SleepPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <SleepDashboard />
    </div>
  );
}
