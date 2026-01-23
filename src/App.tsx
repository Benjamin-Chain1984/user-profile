import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import ClientScanPage from "./pages/ClientScan";
import ClientPosterPage from "./pages/ClientPoster";
import AdminPage from "./pages/Admin";
import ModulePlaceholder from "./pages/ModulePlaceholder";
import PainCheckPage from "./pages/PainCheck";
import BowelCarePage from "./pages/BowelCare";
import ContinencePage from "./pages/Continence";
import CatheterPage from "./pages/Catheter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* QR Scan route - handles auth check internally */}
              <Route path="/c/:token" element={<ClientScanPage />} />
              
              {/* Client poster page - printable */}
              <Route path="/client/:clientId/poster" element={
                <ProtectedRoute requiredRole="admin">
                  <ClientPosterPage />
                </ProtectedRoute>
              } />
              
              {/* Protected routes with sidebar */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Index />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Pain Assessment module */}
              <Route path="/module/pain-check" element={
                <ProtectedRoute>
                  <MainLayout>
                    <PainCheckPage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Bowel Care / Constipation module */}
              <Route path="/module/constipation" element={
                <ProtectedRoute>
                  <MainLayout>
                    <BowelCarePage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Continence Management module */}
              <Route path="/module/continence" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ContinencePage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Module placeholder route for other modules */}
              <Route path="/module/:moduleId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModulePlaceholder />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout>
                    <AdminPage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
