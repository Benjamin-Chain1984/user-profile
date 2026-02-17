/**
 * Pressure Area Prevention Page - Module entry point
 */

import { PressureAreaDashboard } from '@/components/pressureArea';

export default function PressureAreaPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <PressureAreaDashboard />
    </div>
  );
}
