/**
 * Subscription & Billing Section Component
 * NDIS Low Cost Assistive Technology Individual Subscription
 * 
 * This component appears ONLY at the bottom of Profile Settings
 * and manages individual participant subscriptions only.
 */

import { useState } from 'react';
import { 
  CreditCard, 
  Calendar, 
  FileText, 
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/useSubscription';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { format } from 'date-fns';
import type { BillingCycle, SubscriptionStatus, InvoiceStatus } from '@/types/subscription';

const BILLING_OPTIONS: { value: BillingCycle; label: string; price: string; description: string }[] = [
  { value: 'monthly', label: 'Monthly', price: '$35', description: 'per month' },
  { value: 'quarterly', label: 'Quarterly', price: '$100', description: 'per quarter (3 months)' },
  { value: 'annual', label: 'Annual', price: '$350', description: 'per year' },
];

export function SubscriptionBillingSection() {
  const { subscription, invoices, isLoading, updateBillingCycle } = useSubscription();
  const { isAdmin } = useRoleAccess();
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCycleChange = async () => {
    if (!selectedCycle || selectedCycle === subscription?.billingCycle) return;
    
    setIsSaving(true);
    await updateBillingCycle(selectedCycle);
    setIsSaving(false);
    setSelectedCycle(null);
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const config: Record<SubscriptionStatus, { label: string; variant: string; icon: React.ReactNode }> = {
      trial: { 
        label: 'Trial', 
        variant: 'bg-primary/10 text-primary border-primary/20',
        icon: <Clock className="w-3 h-3" />
      },
      active: { 
        label: 'Active', 
        variant: 'bg-success/10 text-success border-success/20',
        icon: <CheckCircle2 className="w-3 h-3" />
      },
      grace_period: { 
        label: 'Grace Period', 
        variant: 'bg-warning/10 text-warning border-warning/20',
        icon: <AlertTriangle className="w-3 h-3" />
      },
      restricted: { 
        label: 'Restricted', 
        variant: 'bg-destructive/10 text-destructive border-destructive/20',
        icon: <AlertTriangle className="w-3 h-3" />
      },
      suspended: { 
        label: 'Suspended', 
        variant: 'bg-muted text-muted-foreground border-muted',
        icon: <XCircle className="w-3 h-3" />
      },
    };

    const statusConfig = config[status];
    return (
      <Badge className={`${statusConfig.variant} gap-1`}>
        {statusConfig.icon}
        {statusConfig.label}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="text-success border-success/30">Paid</Badge>;
      case 'due':
        return <Badge variant="outline" className="text-warning border-warning/30">Due</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="text-destructive border-destructive/30">Overdue</Badge>;
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentCycle = selectedCycle || subscription?.billingCycle || 'monthly';
  const hasChanges = selectedCycle && selectedCycle !== subscription?.billingCycle;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Subscription & Billing</CardTitle>
        </div>
        <CardDescription>
          Manage your IDEAL subscription. Pricing is fixed under NDIS Low Cost Assistive Technology.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* NDIS Classification - Read Only */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            NDIS Classification
          </h4>
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="font-semibold text-foreground">
              Assistive Technology – Low Cost Assistive Technology
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              (NDIS Support Category 03)
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            IDEAL is classified as Low Cost Assistive Technology under the NDIS Assistive Technology support category.
            It does not require a formal AT assessment and may be claimed where it meets a participant's reasonable and necessary goals.
          </p>
        </div>

        <Separator />

        {/* Subscription Type - Read Only */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Subscription Type</h4>
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-foreground">
              {subscription?.subscriptionType || 'Low Cost Assistive Technology – Individual Subscription'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Subscription Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Subscription Status
          </h4>
          <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              {subscription && getStatusBadge(subscription.status)}
            </div>
            {subscription?.trialEndsAt && subscription.status === 'trial' && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trial ends</span>
                <span className="text-foreground">
                  {format(new Date(subscription.trialEndsAt), 'dd MMM yyyy')}
                </span>
              </div>
            )}
            {subscription?.currentPeriodEnd && subscription.status === 'active' && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Next billing date</span>
                <span className="text-foreground">
                  {format(new Date(subscription.currentPeriodEnd), 'dd MMM yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Billing Cycle Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Billing Cycle</h4>
          <RadioGroup
            value={currentCycle}
            onValueChange={(value) => setSelectedCycle(value as BillingCycle)}
            disabled={!isAdmin}
            className="space-y-3"
          >
            {BILLING_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-3 p-4 rounded-lg border ${
                  currentCycle === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-muted/30'
                }`}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label 
                  htmlFor={option.value} 
                  className="flex-1 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-foreground">{option.label}</span>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <span className="text-lg font-semibold text-foreground">{option.price}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Pricing for individual participants is fixed and consistent under NDIS Low Cost Assistive Technology.
          </p>
          {hasChanges && isAdmin && (
            <Button 
              onClick={handleCycleChange} 
              disabled={isSaving}
              className="w-full"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Billing Cycle
            </Button>
          )}
        </div>

        <Separator />

        {/* Invoice History - Read Only */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoice History
          </h4>
          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium text-foreground">{invoice.invoiceNumber}</span>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(invoice.billingPeriodStart), 'dd MMM')} – {format(new Date(invoice.billingPeriodEnd), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(invoice.totalCents)}
                      </span>
                      <p className="text-xs text-muted-foreground">inc. GST</p>
                    </div>
                    {getInvoiceStatusBadge(invoice.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            </div>
          )}
        </div>

        {/* Status-based warnings */}
        {subscription?.status === 'grace_period' && (
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              Your payment is overdue. Please update your payment to avoid service interruption.
            </AlertDescription>
          </Alert>
        )}

        {subscription?.status === 'restricted' && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Your subscription is restricted to read-only access. Please complete payment to restore full access.
            </AlertDescription>
          </Alert>
        )}

        {subscription?.status === 'suspended' && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Your subscription has been suspended. Please contact support to restore access.
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance note */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            This is an individual subscription for NDIS participants. Billing and invoices may be managed externally 
            depending on your plan. Contact support for assistance with payment issues.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
