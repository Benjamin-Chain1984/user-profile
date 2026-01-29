import React from 'react';
import { FluidDashboard } from '@/components/fluidBalance';

const FluidBalancePage: React.FC = () => {
  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fluid Balance & Hydration</h1>
        <p className="text-muted-foreground">
          Track fluid intake, output, and monitor hydration status
        </p>
      </div>
      <FluidDashboard />
    </div>
  );
};

export default FluidBalancePage;
