/**
 * Access Denied Page - Shown when user lacks permissions for a route
 */

import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedPageProps {
  message?: string;
}

export function AccessDeniedPage({ 
  message = "Access restricted. Please contact a supervisor." 
}: AccessDeniedPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-destructive/10 rounded-full p-4 mb-4">
        <ShieldX className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Access Restricted
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        {message}
      </p>
      <Button onClick={() => navigate('/')}>
        Return to Home
      </Button>
    </div>
  );
}
