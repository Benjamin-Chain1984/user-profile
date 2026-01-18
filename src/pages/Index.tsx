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
import { Heart } from 'lucide-react';
function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  return <div className="min-h-screen bg-background pb-24">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">IDEAL</span>
          </div>
          
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === 'home' && <div className="space-y-6 animate-fade-in">
            <ProfileHeader />
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Alerts</h2>
              <AlertDashboard />
            </section>
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Active Modules</h2>
              <ModuleGrid />
            </section>
          </div>}

        {activeTab === 'profile' && <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Individual Profile</h1>
              <p className="text-muted-foreground mt-1">Personal details and contacts</p>
            </div>
            <ProfileCompletionBanner />
            <ProfileForm />
          </div>}

        {activeTab === 'modules' && <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Health Modules</h1>
              <p className="text-muted-foreground mt-1">Configure active monitoring</p>
            </div>
            <ProfileCompletionBanner />
            <ModuleSelector />
          </div>}

        {activeTab === 'resources' && <div className="space-y-6 animate-fade-in">
            <IndustryResources />
          </div>}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>;
}
const Index = () => {
  return <ProfileProvider>
      <AppContent />
    </ProfileProvider>;
};
export default Index;