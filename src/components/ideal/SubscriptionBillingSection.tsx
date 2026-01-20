import { useState } from 'react';
import { CreditCard, Calendar, Mail, FileText, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface InvoiceItem {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
}

const mockInvoices: InvoiceItem[] = [
  { id: 'INV-001', date: '2024-01-15', amount: '$29.00', status: 'paid' },
  { id: 'INV-002', date: '2024-02-15', amount: '$29.00', status: 'paid' },
  { id: 'INV-003', date: '2024-03-15', amount: '$29.00', status: 'pending' },
];

export function SubscriptionBillingSection() {
  const [billingEmail, setBillingEmail] = useState('billing@example.com');

  // Placeholder data - will be connected to actual billing system
  const subscription = {
    plan: 'Trial',
    status: 'Active',
    nextBillingDate: '2024-04-15',
    paymentMethod: 'Visa •••• 4242',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'Trial':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Trial</Badge>;
      case 'Expired':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Expired</Badge>;
      case 'Cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInvoiceStatusBadge = (status: InvoiceItem['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="text-success border-success/30">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning/30">Pending</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="text-destructive border-destructive/30">Overdue</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Subscription & Billing</CardTitle>
        </div>
        <CardDescription>
          Manage your subscription plan and billing details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Current Plan
          </h4>
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-foreground">{subscription.plan}</span>
              {getStatusBadge(subscription.status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 text-foreground">{subscription.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Next billing:</span>
                <span className="ml-2 text-foreground">{subscription.nextBillingDate}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2">
            <Settings className="w-4 h-4" />
            Manage Subscription
          </Button>
        </div>

        <Separator />

        {/* Payment Method */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Method
          </h4>
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <span className="text-foreground">{subscription.paymentMethod}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2">
            <CreditCard className="w-4 h-4" />
            Update Payment Method
          </Button>
        </div>

        <Separator />

        {/* Billing Contact */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Billing Contact
          </h4>
          <div className="space-y-2">
            <Label htmlFor="billingEmail">Billing Email</Label>
            <Input
              id="billingEmail"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@example.com"
            />
          </div>
          <Button variant="outline" size="sm">
            Update Billing Details
          </Button>
        </div>

        <Separator />

        {/* Invoice History */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoice History
          </h4>
          <div className="space-y-2">
            {mockInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium text-foreground">{invoice.id}</span>
                    <p className="text-xs text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{invoice.amount}</span>
                  {getInvoiceStatusBadge(invoice.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Billing and invoices may be managed externally depending on your plan. Contact support for assistance with payment issues.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
