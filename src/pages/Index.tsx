import { useState } from 'react';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { Navigation } from '@/components/ideal/Navigation';
import { ProfileHeader } from '@/components/ideal/ProfileHeader';
import { AlertDashboard } from '@/components/ideal/AlertDashboard';
import { ModuleGrid } from '@/components/ideal/ModuleGrid';
import { ProfileForm } from '@/components/ideal/ProfileForm';
import { ModuleSelector } from '@/components/ideal/ModuleSelector';
import { ProfileCompletionBanner } from '@/components/ideal/ProfileCompletionBanner';
import { IndustryResources } from '@/components/ideal/IndustryResources';
import { AppHeader } from '@/components/ideal/AppHeader';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-24 safe-area-inset">
      {/* Header with Logo */}
      <AppHeader />

      {/* Main Content - Responsive container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'home' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <ProfileHeader />
            
            {/* Two-column layout on larger screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 sm:mb-4">Alerts</h2>
                <AlertDashboard />
              </section>
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 sm:mb-4">Active Modules</h2>
                <ModuleGrid />
              </section>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Individual Profile</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Personal details and contacts</p>
            </div>
            <ProfileCompletionBanner />
            <ProfileForm />
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Health Modules</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Configure active monitoring</p>
            </div>
            <ProfileCompletionBanner />
            <ModuleSelector />
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <IndustryResources />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

const Index = () => {
  return (
    <ProfileProvider>
      <AppContent />
    </ProfileProvider>
  );
};

export default Index;