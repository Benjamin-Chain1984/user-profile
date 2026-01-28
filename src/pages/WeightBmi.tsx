/**
 * Weight & BMI Module Page - Entry point
 */

import { WeightBmiDashboard } from '@/components/weightBmi';

export default function WeightBmiPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <WeightBmiDashboard />
    </div>
  );
}
