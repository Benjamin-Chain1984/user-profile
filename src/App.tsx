import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RolePreviewProvider } from "@/contexts/RolePreviewContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import OAuthConsent from "./pages/OAuthConsent";
import ClientScanPage from "./pages/ClientScan";
import ClientPosterPage from "./pages/ClientPoster";
import AdminPage from "./pages/Admin";
import ModulePlaceholder from "./pages/ModulePlaceholder";
import PainCheckPage from "./pages/PainCheck";
import BowelCarePage from "./pages/BowelCare";
import ContinencePage from "./pages/Continence";
import CatheterPage from "./pages/Catheter";
import WeightBmiPage from "./pages/WeightBmi";
import FluidBalancePage from "./pages/FluidBalance";
import HealthMonitoringPage from "./pages/HealthMonitoring";
import HealthPreventionPage from "./pages/HealthPrevention";
import SleepPage from "./pages/Sleep";
import OralHealthPage from "./pages/OralHealth";
import EpilepsyPage from "./pages/Epilepsy";
import PressureAreaPage from "./pages/PressureArea";
import IddsiPage from "./pages/Iddsi";
import EnteralPage from "./pages/Enteral";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ProtectedAppShell() {
  return (
    <ProtectedRoute>
      <ProfileProvider>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </ProfileProvider>
    </ProtectedRoute>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RolePreviewProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

                
                {/* QR Scan route - handles auth check internally */}
                <Route path="/c/:token" element={<ClientScanPage />} />
                
                {/* Client poster page - printable */}
                <Route path="/client/:clientId/poster" element={
                  <ProtectedRoute requiredRole="admin">
                    <ClientPosterPage />
                  </ProtectedRoute>
                } />

                {/* Protected routes with sidebar + single ProfileProvider */}
                <Route element={<ProtectedAppShell />}>
                  <Route path="/" element={<Index />} />

                  {/* Modules */}
                  <Route path="/module/pain-check" element={<PainCheckPage />} />
                  <Route path="/module/constipation" element={<BowelCarePage />} />
                  <Route path="/module/continence" element={<ContinencePage />} />
                  <Route path="/module/catheter" element={<CatheterPage />} />
                  <Route path="/module/weight" element={<WeightBmiPage />} />
                  <Route path="/module/fluid-balance" element={<FluidBalancePage />} />
                  <Route path="/module/health-monitoring" element={<HealthMonitoringPage />} />
                  <Route path="/module/health-prevention" element={<HealthPreventionPage />} />
                  <Route path="/module/sleep" element={<SleepPage />} />
                  <Route path="/module/oral-health" element={<OralHealthPage />} />
                  <Route path="/module/epilepsy" element={<EpilepsyPage />} />
                  <Route path="/module/pressure-area" element={<PressureAreaPage />} />
                  <Route path="/module/iddsi" element={<IddsiPage />} />
                  <Route path="/module/enteral" element={<EnteralPage />} />
                  <Route path="/module/:moduleId" element={<ModulePlaceholder />} />

                  {/* Admin */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RolePreviewProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
