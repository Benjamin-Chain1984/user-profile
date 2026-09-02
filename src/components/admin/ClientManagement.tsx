/**
 * Client Management Component
 * List, add, edit clients with poster generation and QR rotation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, FileText, Edit, Eye, Printer, MoreHorizontal, UserRound, ArrowRightCircle, CheckCircle2, UserCog, QrCode } from 'lucide-react';
import { useActiveClient } from '@/contexts/ActiveClientContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientFormDialog } from './ClientFormDialog';
import { PosterPreviewDialog } from './PosterPreviewDialog';
import { RotateQRDialog } from './RotateQRDialog';
import { ClientAuditDialog } from './ClientAuditDialog';
import { ClientAccessDialog } from './ClientAccessDialog';
import { toast } from 'sonner';
import type { Client } from '@/services/clientToken/types';
import { TrafficLightIcon } from '@/components/shared/TrafficLightIcon';
import { TrafficLightBadge } from '@/components/shared/TrafficLightBadge';
import { useClientsIdealSignal } from '@/hooks/useClientsIdealSignal';

interface ClientRow {
  id: string;
  preferred_name: string;
  photo_url: string | null;
  beacon_id: string | null;
  status: string;
  poster_qr_token_plain?: string | null;
  poster_qr_token_created_at: string;
  poster_qr_token_rotated_at: string | null;
  created_at: string;
  updated_at: string;
}

export function ClientManagement() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [posterClient, setPosterClient] = useState<{ client: ClientRow; token: string } | null>(null);
  const [rotatingClient, setRotatingClient] = useState<ClientRow | null>(null);
  const [auditClient, setAuditClient] = useState<ClientRow | null>(null);
  const [accessClient, setAccessClient] = useState<ClientRow | null>(null);
  const { activeClientId, setActiveClient } = useActiveClient();
  const { signals } = useClientsIdealSignal(clients.map((c) => c.id));

  const openClientProfile = (client: ClientRow) => {
    setActiveClient(client.id, client.preferred_name);
    toast.success(`Now viewing ${client.preferred_name}'s profile`);
    navigate('/');
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('preferred_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleClientSaved = () => {
    fetchClients();
    setShowAddDialog(false);
    setEditingClient(null);
  };

  // Open the client's live QR link so admins can test the scan-to-login flow
  const testQrLogin = (client: ClientRow) => {
    const token = (client as any).poster_qr_token_plain as string | undefined;
    if (!token) {
      toast.error('No QR token yet — use "Generate Poster" first, then test again.');
      return;
    }
    window.open(`/c/${token}`, '_blank', 'noopener');
  };

  const handleRotateComplete = (newToken: string) => {
    if (rotatingClient) {
      setPosterClient({ client: rotatingClient, token: newToken });
    }
    setRotatingClient(null);
    fetchClients();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Client Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage client profiles, generate posters, and rotate QR codes
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <p className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
        <UserRound className="h-4 w-4 shrink-0 text-primary" />
        Click a client (or their Open button) to switch into their individual profile. The active client is highlighted.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Clients ({clients.length})</span>
            <Button variant="ghost" size="sm" onClick={fetchClients} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clients found. Add your first client to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IDEAL signal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>QR Token</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => openClientProfile(client)}
                    className={`cursor-pointer transition-colors ${
                      activeClientId === client.id
                        ? 'bg-primary/10 hover:bg-primary/15'
                        : 'hover:bg-muted/60'
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {client.photo_url ? (
                          <img
                            src={client.photo_url}
                            alt={client.preferred_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                            {client.preferred_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{client.preferred_name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const signal = signals[client.id];
                        if (!signal) {
                          return <span className="text-sm text-muted-foreground">—</span>;
                        }
                        return (
                          <div className="flex items-center gap-2">
                            <TrafficLightIcon status={signal.status} size="sm" />
                            <TrafficLightBadge
                              status={signal.status}
                              size="sm"
                              isPaused={signal.isPaused}
                            />
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <div>Created: {new Date(client.poster_qr_token_created_at).toLocaleDateString()}</div>
                        {client.poster_qr_token_rotated_at && (
                          <div className="text-xs">
                            Rotated: {new Date(client.poster_qr_token_rotated_at).toLocaleDateString()}
                          </div>
                        )}
                        {client.poster_qr_token_plain ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              testQrLogin(client);
                            }}
                            className="text-xs text-primary mt-1 underline underline-offset-2"
                          >
                            Test QR login
                          </button>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">
                            Generate poster to create QR link
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {activeClientId === client.id ? (
                          <Button size="sm" variant="default" className="gap-1.5" onClick={() => navigate('/')}>
                            <CheckCircle2 className="h-4 w-4" />
                            Viewing
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                            onClick={() => openClientProfile(client)}
                          >
                            <ArrowRightCircle className="h-4 w-4" />
                            Open
                          </Button>
                        )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openClientProfile(client)}>
                            <UserRound className="h-4 w-4 mr-2" />
                            Open Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setAccessClient(client)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Manage Record Access
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditingClient(client)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAuditClient(client)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Audit Log
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => testQrLogin(client)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Test QR Login
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/client/${client.id}/poster`)}>
                            <Printer className="h-4 w-4 mr-2" />
                            View Poster
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRotatingClient(client)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Poster
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setRotatingClient(client)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Rotate QR Code
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ClientFormDialog
        open={showAddDialog || !!editingClient}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingClient(null);
          }
        }}
        client={editingClient}
        onSaved={handleClientSaved}
      />

      <PosterPreviewDialog
        open={!!posterClient}
        onOpenChange={(open) => !open && setPosterClient(null)}
        client={posterClient?.client || null}
        token={posterClient?.token || ''}
      />

      <RotateQRDialog
        open={!!rotatingClient}
        onOpenChange={(open) => !open && setRotatingClient(null)}
        client={rotatingClient}
        onComplete={handleRotateComplete}
      />

      <ClientAuditDialog
        open={!!auditClient}
        onOpenChange={(open) => !open && setAuditClient(null)}
        client={auditClient}
      />

      <ClientAccessDialog
        open={!!accessClient}
        onOpenChange={(open) => !open && setAccessClient(null)}
        clientId={accessClient?.id ?? null}
        clientName={accessClient?.preferred_name}
      />

    </div>
  );
}
