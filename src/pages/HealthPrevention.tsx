/**
 * Health Prevention Page - Module entry point
 * Screening & Immunisation tracking aligned with Australian guidelines
 */

import { ProfileProvider } from '@/contexts/ProfileContext';
import { HealthPreventionDashboard } from '@/components/healthPrevention';

export default function HealthPreventionPage() {
  return (
    <ProfileProvider>
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <HealthPreventionDashboard />
      </div>
    </ProfileProvider>
  );
}
