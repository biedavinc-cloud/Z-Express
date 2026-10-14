import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import BillingHistory from '@/components/portal/BillingHistory';
import PricingTable from '@/components/pricing/PricingTable';
import PricingCalculator from '@/components/pricing/PricingCalculator';
import CheckoutForm from '@/components/pricing/CheckoutForm';
import { formatDate, formatMoney } from '@/lib/logistics';

export default function PortalSubscription() {
  const { tenant, t, session } = useOutletContext();
  const [subscription, setSubscription] = useState(null);
  const [cycle, setCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const load = async () => {
    const list = await base44.entities.Subscription.filter({ tenant_id: tenant.id }, { sort: '-created_date', limit: 5 });
    const current = (list.items || list)[0] || null;
    setSubscription(current);
    if (current?.billing_cycle) setCycle(current.billing_cycle);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  // Cancelling is the agency's own decision: the plan runs to the end of the period
  // it has already paid for and nothing further is billed.
  const cancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      const response = await base44.functions.invoke('billingCheckout', { action: 'cancel', tenant_id: tenant.id });
      const result = response?.data || {};
      if (result.error) throw new Error(result.error);
      await load();
    } catch (err) {
      setCancelError(t('sub.cancelFailed'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  const current = subscription?.plan || tenant.plan;
  // An agency that already pays is charged for the period it moves to; a new or
  // still-trialing one keeps its free month.
  const startMode = subscription?.status === 'active' ? 'now' : 'trial';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('sub.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('sub.model')}</p>
        </div>
        {subscription && subscription.status !== 'cancelled' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl border-border text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {t('sub.cancel')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('sub.cancelTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('sub.cancelBody', { date: subscription.current_period_end || '—' })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
              <AlertDialogFooter>
                <AlertDialogCancel>{t('sub.cancelKeep')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={cancel}
                  disabled={cancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('sub.cancelConfirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent">
            <CreditCard className="h-5 w-5" />
          </span>
          <p className="mt-5 font-heading text-2xl font-semibold capitalize text-primary">{current}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('sub.currentPlan')}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('sub.status')}</p>
          <p className="mt-3 font-heading text-lg font-semibold text-primary">
            {t(`sub.status.${subscription?.status || 'trialing'}`)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {subscription ? formatMoney(subscription.amount, subscription.currency) : '—'} {t('pricing.perMonth')}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('sub.renews')}</p>
          <p className="mt-3 font-heading text-lg font-semibold text-primary">
            {subscription?.current_period_end || '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('sub.seats')}: {subscription?.seats || '—'}
          </p>
        </div>
      </div>

      <PricingTable
        cycle={cycle}
        onCycleChange={setCycle}
        currentPlan={current}
        onChoose={(plan) => setCheckout({ planId: plan.id, cycle, startMode })}
      />

      <PricingCalculator
        initial={{ planId: current, cycle }}
        onContinue={(selection) =>
          setCheckout({
            planId: selection.planId,
            cycle: selection.cycle,
            extraSeats: selection.extraSeats,
            providerId: selection.providerId,
            startMode,
          })
        }
      />

      {subscription?.started_at && (
        <p className="text-xs text-muted-foreground">
          {formatDate(subscription.started_at, false)} → {subscription.current_period_end}
        </p>
      )}

      <BillingHistory tenantId={tenant.id} t={t} />

      <Dialog open={Boolean(checkout)} onOpenChange={(open) => !open && setCheckout(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          {checkout && (
            <CheckoutForm
              tenant={tenant}
              session={session}
              initial={checkout}
              onDone={load}
              onClose={() => setCheckout(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}