import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RolePreviewProvider } from "@/contexts/RolePreviewContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ActiveClientProvider } from "@/contexts/ActiveClientContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SubscriptionGate } from "@/components/auth/SubscriptionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import ResetPasswordPage from "./pages/ResetPassword";
import CheckoutPage from "./pages/Checkout";
import CheckoutReturnPage from "./pages/CheckoutReturn";
import OAuthConsent from "./pages/OAuthConsent";
import ClientScanPage from "./pages/ClientScan";
import ClientPosterPage from "./pages/ClientPoster";
import AdminPage from "./pages/Admin";
import AdminTeamPage from "./pages/AdminTeam";
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
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import Landing from "./pages/marketing/Landing";
import Features from "./pages/marketing/Features";
import Pricing from "./pages/marketing/Pricing";
import About from "./pages/marketing/About";
import Contact from "./pages/marketing/Contact";
import Terms from "./pages/marketing/Terms";
import Privacy from "./pages/marketing/Privacy";
import Disclaimer from "./pages/marketing/Disclaimer";

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
      <SubscriptionGate>
      <ActiveClientProvider>
        <ProfileProvider>
          <MainLayout>
            <Outlet />
          </MainLayout>
        </ProfileProvider>
      </ActiveClientProvider>
      </SubscriptionGate>
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
                {/* Public marketing site */}
                <Route element={<MarketingLayout />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                </Route>

                {/* Public routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/return" element={<CheckoutReturnPage />} />
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
                  <Route path="/dashboard" element={<Index />} />

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
                  <Route
                    path="/admin/team"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminTeamPage />
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
