/**
 * Audit Log Viewer Component
 * View all audit events across the system
 */

import { useState, useEffect } from 'react';
import { auditService, type AuditEvent } from '@/services/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Search, Filter } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const actionColors: Record<string, string> = {
  CLIENT_ACCESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  QR_ROTATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  LOGIN_SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  LOGIN_FAIL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  OTP_SENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  OTP_VERIFY_FAIL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'CLIENT_ACCESS', label: 'Client Access' },
  { value: 'QR_ROTATE', label: 'QR Rotate' },
  { value: 'LOGIN_SUCCESS', label: 'Login Success' },
  { value: 'LOGIN_FAIL', label: 'Login Fail' },
  { value: 'OTP_SENT', label: 'OTP Sent' },
  { value: 'OTP_VERIFY_FAIL', label: 'OTP Verify Fail' },
];

export function AuditLogViewer() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getRecentEvents(500);
      setEvents(data);
    } catch (err) {
      console.error('Error fetching audit events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesAction = actionFilter === 'all' || event.action === actionFilter;
    const matchesSearch =
      !searchQuery ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.metadata?.route?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            View all system events and access logs
          </p>
        </div>
        <Button variant="outline" onClick={fetchEvents} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Events ({filteredEvents.length})</span>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit events found.
            </div>
          ) : (
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(event.timestamp, 'MMM d, HH:mm')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={actionColors[event.action] || 'bg-muted text-muted-foreground'}
                        >
                          {event.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {event.metadata?.route && <div>Route: {event.metadata.route}</div>}
                          {event.clientId && (
                            <div className="text-xs truncate max-w-[200px]">
                              Client: {event.clientId}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {event.actorUserId || 'Anonymous'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
