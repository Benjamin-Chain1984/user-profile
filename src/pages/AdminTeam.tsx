/**
 * Admin Team Page
 * Staff management for administrators
 */

import { MyTeam } from '@/components/team/MyTeam';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function AdminTeamPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Team
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage staff who can authenticate via QR + SMS OTP and access client records.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="p-4 sm:p-6">
          <MyTeam />
          <p className="text-xs text-muted-foreground mt-4">
            Once a member is added and their phone verified, grant them access to a client
            under Clients &gt; Actions &gt; Manage Record Access.
          </p>
        </Card>
      </main>
    </div>
  );
}
