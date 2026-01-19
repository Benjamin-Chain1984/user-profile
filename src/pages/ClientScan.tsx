/**
 * Client Scan Page - /c/:token
 * 
 * Handles QR code scan flow:
 * 1. If not authenticated, shows neutral prompt to sign in
 * 2. If authenticated, resolves token to client and shows overview
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { clientTokenService, type Client } from '@/services/clientToken';
import { auditService } from '@/services/audit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, QrCode, LogIn, ArrowRight } from 'lucide-react';
import idealLogo from '@/assets/ideal-logo.png';

export default function ClientScanPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, isStaff } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      // User needs to sign in first
      setIsLoading(false);
      return;
    }

    if (!isStaff) {
      setError('You do not have permission to access client records.');
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError('Invalid QR code. No token provided.');
      setIsLoading(false);
      return;
    }

    // Resolve the token
    async function resolveToken() {
      try {
        const result = await clientTokenService.resolveClientByToken(token!);
        
        if (result.success && result.client) {
          setClient(result.client);
          
          // Log access event
          await auditService.logEvent('CLIENT_ACCESS', result.client.id, {
            route: location.pathname,
            accessMethod: 'qr_scan',
          });
        } else {
          setError(result.error || 'Unable to access this client record.');
        }
      } catch (err) {
        console.error('Error resolving token:', err);
        setError('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    }

    resolveToken();
  }, [token, isAuthenticated, isStaff, authLoading, location.pathname]);

  const handleSignIn = () => {
    navigate('/auth', { state: { from: location } });
  };

  const handleViewClient = () => {
    if (client) {
      navigate(`/clients/${client.id}`);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show neutral sign in prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Client Record Access</CardTitle>
              <CardDescription>
                You've scanned a client poster. Please sign in to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSignIn} className="w-full" size="lg">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Protected health information. Authorized personnel only.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>

          <Card className="border-destructive/50 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Access Error</CardTitle>
              <CardDescription className="text-base">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => navigate('/')} className="w-full" variant="outline">
                Go to Home
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                If this poster was recently replaced, please ask an admin for the new version.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success - show client overview
  if (client) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <img src={idealLogo} alt="IDEAL" className="h-10 w-auto" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Home
            </Button>
          </div>

          {/* Client Card */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                {client.photoUrl ? (
                  <img 
                    src={client.photoUrl} 
                    alt={client.preferredName} 
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {client.preferredName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{client.preferredName}</CardTitle>
                  {client.shortBio && (
                    <CardDescription className="mt-1">{client.shortBio}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-foreground">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={handleViewClient}
                >
                  <span className="text-lg">📝</span>
                  <span>New Entry</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate(`/clients/${client.id}/bowel`)}
                >
                  <span className="text-lg">🚽</span>
                  <span>Bowel</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate(`/clients/${client.id}/vitals`)}
                >
                  <span className="text-lg">❤️</span>
                  <span>Vitals</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate(`/clients/${client.id}/wounds`)}
                >
                  <span className="text-lg">🩹</span>
                  <span>Wounds</span>
                </Button>
              </div>

              <Button 
                variant="secondary" 
                className="w-full mt-4"
                onClick={handleViewClient}
              >
                View Full Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
