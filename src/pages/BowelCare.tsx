/**
 * Bowel Care Page - Module entry point
 */

import { BowelCareDashboard } from '@/components/bowelCare';

// For demo purposes, using a placeholder client ID
// In production, this would come from route params or context
const DEMO_CLIENT_ID = 'demo-client-id';

export default function BowelCarePage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <BowelCareDashboard clientId={DEMO_CLIENT_ID} />
    </div>
  );
}
