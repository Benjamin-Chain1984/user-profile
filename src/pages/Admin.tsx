/**
 * Admin Dashboard Page
 * Client management, poster generation, QR rotation, and audit logs
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientManagement } from '@/components/admin/ClientManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { MyTeam } from '@/components/team/MyTeam';
import { Card } from '@/components/ui/card';
import { Users, UserCog, Shield } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('clients');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage clients, team members, and view audit logs
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card className="p-4 sm:p-6">
              <MyTeam />
              <p className="text-xs text-muted-foreground mt-4">
                Once a member is added and their phone verified, grant them access to a client
                under Clients &gt; Actions &gt; Manage Record Access.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditLogViewer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
