import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandMark from '@/components/site/BrandMark';
import { useI18n } from '@/components/LanguageProvider';
import { useCountry } from '@/components/site/useCountry';
import BrandPanel from '@/components/onboarding/BrandPanel';
import CompanyStep from '@/components/onboarding/CompanyStep';
import DocumentsStep from '@/components/onboarding/DocumentsStep';
import OperationsStep from '@/components/onboarding/OperationsStep';
import { reviewStatus } from '@/lib/documents';
import PlanStep from '@/components/onboarding/PlanStep';
import StepIndicator from '@/components/onboarding/StepIndicator';
import SuccessPanel from '@/components/onboarding/SuccessPanel';
import { Image } from '@/components/ui/image';
import { IMAGE_OPACITY, ONBOARD_IMAGE } from '@/lib/siteImages';
import { PLANS } from '@/lib/logistics';
import { TRIAL_DAYS } from '@/lib/pricing';

const STEPS = [
  { key: 'company', label: 'onboard.step.company', title: 'onboard.title', subtitle: 'onboard.subtitle' },
  {
    key: 'operations',
    label: 'onboard.step.operations',
    title: 'onboard.operations',
    subtitle: 'onboard.operationsSubtitle',
  },
  {
    key: 'documents',
    label: 'onboard.step.documents',
    title: 'onboard.documents',
    subtitle: 'onboard.documentsSubtitle',
  },
  { key: 'plan', label: 'onboard.step.plan', title: 'onboard.choosePlan', subtitle: 'onboard.choosePlanSubtitle' },
];

export default function Onboarding() {
  const { t, lang, setLang } = useI18n();
  const { country } = useCountry();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState('monthly');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState({
    name: '',
    legal_name: '',
    country,
    city: '',
    phone: '',
    website: '',
    about: '',
    address: '',
    tracking_prefix: '',
    currency: 'XAF',
    brand_color: '#3D1E00',
    accent_color: '#FF8E24',
    documents: [],
    plan: PLANS.some((p) => p.id === params.get('plan')) ? params.get('plan') : 'starter',
  });

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const prefixFrom = (name) => (name || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();

  const validateCompany = () => {
    const next = {};
    if (!form.name.trim()) next.name = t('onboard.nameRequired');
    if (!form.city.trim()) next.city = t('onboard.required');
    if (!form.phone.trim()) next.phone = t('onboard.required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 0) {
      if (!validateCompany()) return;
      setForm((prev) => ({
        ...prev,
        tracking_prefix: (prev.tracking_prefix || prefixFrom(prev.name)).toUpperCase(),
      }));
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const submit = async () => {
    setErrors({});
    if (!validateCompany()) {
      setStep(0);
      return;
    }
    setBusy(true);
    try {
      const me = await base44.auth.me();
      if (!me) {
        navigate('/login?returnTo=/portal/onboarding');
        return;
      }
      const plan = PLANS.find((p) => p.id === form.plan) || PLANS[0];
      const name = form.name.trim();

      const tenant = await base44.entities.Tenant.create({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
        legal_name: form.legal_name,
        email: me.email,
        phone: form.phone,
        website: form.website,
        country: form.country,
        city: form.city,
        address: form.address,
        about: form.about,
        plan: plan.id,
        monthly_fee: plan.monthly,
        currency: form.currency,
        status: 'pending',
        tracking_prefix: (form.tracking_prefix || prefixFrom(name)).toUpperCase(),
        owner_email: me.email,
        owner_user_id: me.id,
        brand_color: form.brand_color,
        accent_color: form.accent_color,
        documents: form.documents || [],
        kyc_status: reviewStatus(form.documents || []),
        member_emails: [me.email],
      });

      await base44.entities.Subscription.create({
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        plan: plan.id,
        amount: cycle === 'yearly' ? plan.yearly : plan.monthly,
        currency: plan.currency,
        billing_cycle: cycle,
        status: 'trialing',
        seats: plan.seats,
        started_at: new Date().toISOString().slice(0, 10),
        current_period_end: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString().slice(0, 10),
        member_emails: [me.email],
      });

      setCreated(tenant);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setErrors({ global: err.message || t('common.error') });
    } finally {
      setBusy(false);
    }
  };

  const current = STEPS[step];

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src={ONBOARD_IMAGE}
          alt=""
          className="h-full w-full"
          style={{ opacity: IMAGE_OPACITY }}
          fittingType="fill"
          focalPointX={0.55}
          focalPointY={0.42}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/35 to-transparent" />
      </div>

      <div className="relative">
      <header className="border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-1.5">
            {['en', 'fr'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`rounded-full px-3 py-1 text-xs font-medium uppercase transition ${
                  lang === code ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {created ? (
          <SuccessPanel tenant={created} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <BrandPanel />

            <section className="rounded-3xl border border-border bg-card/90 p-6 backdrop-blur-md sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {t('onboard.stepOf', { current: step + 1, total: STEPS.length })}
              </p>
              <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                {t(current.title)}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{t(current.subtitle)}</p>

              <div className="mt-5 h-1 w-full overflow-hidden bg-secondary">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              <div className="mt-7">
                <StepIndicator steps={STEPS.map((s) => ({ key: s.key, label: t(s.label) }))} current={step} onSelect={setStep} />
              </div>

              <div className="mt-8">
                {current.key === 'company' && <CompanyStep form={form} errors={errors} update={update} />}
                {current.key === 'operations' && <OperationsStep form={form} errors={errors} update={update} />}
                {current.key === 'documents' && <DocumentsStep form={form} setForm={setForm} />}
                {current.key === 'plan' && <PlanStep form={form} setForm={setForm} cycle={cycle} setCycle={setCycle} />}
              </div>

              {errors.global && <p className="mt-5 text-sm text-destructive">{errors.global}</p>}

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep((currentStep) => currentStep - 1)}
                    className="rounded-2xl"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('onboard.back')}
                  </Button>
                ) : (
                  <span />
                )}

                {step < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    className="rounded-2xl bg-accent px-8 text-accent-foreground hover:bg-accent/90"
                  >
                    {t('onboard.next')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    disabled={busy}
                    onClick={submit}
                    className="rounded-2xl bg-accent px-8 text-accent-foreground hover:bg-accent/90"
                  >
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {busy ? t('onboard.creating') : t('onboard.create')}
                  </Button>
                )}
              </div>

              <p className="mt-5 text-xs text-muted-foreground">
                {t('onboard.already')}{' '}
                <Link to="/portal" className="font-medium text-accent">
                  {t('biz.ctaLogin')}
                </Link>
              </p>
            </section>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}