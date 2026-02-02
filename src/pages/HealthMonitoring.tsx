/**
 * Health Monitoring Page - Module entry point
 */

import { HealthMonitoringDashboard } from '@/components/healthMonitoring';

export default function HealthMonitoringPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <HealthMonitoringDashboard />
    </div>
  );
}
