/**
 * Epilepsy Page - Module entry point
 */

import { EpilepsyDashboard } from '@/components/epilepsy';

export default function EpilepsyPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <EpilepsyDashboard />
    </div>
  );
}
