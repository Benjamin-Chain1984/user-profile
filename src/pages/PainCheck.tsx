import { AppHeader } from '@/components/ideal/AppHeader';
import { PainCheckDashboard } from '@/components/painCheck';

export default function PainCheckPage() {
  return (
    <div className="min-h-screen bg-background pb-6 safe-area-inset">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <PainCheckDashboard />
      </main>
    </div>
  );
}
