import React from 'react';
import { FluidDashboard } from '@/components/fluidBalance';

const FluidBalancePage: React.FC = () => {
  return (
    <div className="container max-w-6xl py-6">
      <FluidDashboard />
    </div>
  );
};

export default FluidBalancePage;
