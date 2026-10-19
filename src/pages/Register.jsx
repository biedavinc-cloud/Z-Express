import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, Lock, Mail, UserPlus, UserRound } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { useI18n } from "@/components/LanguageProvider";
import { useCountry } from "@/components/site/useCountry";
import { COUNTRIES } from "@/lib/countries";
import { dialFor, withDialCode } from "@/lib/dialCodes";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const { t } = useI18n();
  const { country: visitorCountry } = useCountry();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [accountType, setAccountType] = useState("individual");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(visitorCountry);
  const dialCode = dialFor(country);

  const finish = () => {
    // A private sender lands in their own space, a logistics company starts the
    // company onboarding, unless they were sent here from a specific page.
    const destination = safeReturnTo();
    window.location.href =
      destination !== "/"
        ? destination
        : accountType === "company"
          ? "/portal/onboarding"
          : "/my-shipments";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const result = await api.auth.register({
        email,
        password,
        profile: {
          account_type: accountType,
          country,
          phone: withDialCode(country, phone),
          display_name: fullName,
          full_name: fullName,
        },
      });
      // With email confirmation switched off the session already exists.
      if (result.needsVerification) setShowOtp(true);
      else finish();
    } catch (err) {
      setError(err.message || t("auth.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      await api.auth.verifyOtp({ email, otpCode });
      finish();
    } catch (err) {
      setError(err.message || t("auth.invalidCode"));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await api.auth.resendOtp(email);
      toast({
        title: t("auth.codeSent"),
        description: t("auth.codeSentBody"),
      });
    } catch (err) {
      setError(err.message || t("auth.resendFailed"));
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await api.auth.loginWithProvider("google", safeReturnTo());
    } catch (err) {
      setError(err.message || t("auth.registerFailed"));
    }
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title={t("auth.verifyTitle")}
        subtitle={t("auth.verifySentTo", { email })}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("auth.verifying")}
            </>
          ) : (
            t("auth.verify")
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("auth.noCode")}{" "}
          <button type="button" onClick={handleResend} className="text-primary font-medium hover:underline">
            {t("auth.resend")}
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={t("auth.createTitle")}
      subtitle={t("auth.createSubtitle")}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.login")}
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        {t("auth.continueGoogle")}
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t("auth.or")}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{t("auth.accountType")}</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              { id: "individual", icon: UserRound, label: t("auth.individual"), hint: t("auth.individualHint") },
              { id: "company", icon: Building2, label: t("auth.company"), hint: t("auth.companyHint") },
            ].map((option) => {
              const Icon = option.icon;
              const active = accountType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAccountType(option.id)}
                  className={`rounded-none border p-3 text-left transition ${
                    active ? "border-accent bg-accent/5" : "border-input hover:border-accent/40"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("auth.fullName")}</Label>
          <Input
            id="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-12 rounded-none"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">{t("auth.country")}</Label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-12 w-full rounded-none border border-input bg-transparent px-3 text-sm outline-none transition focus-visible:ring-1 focus-visible:ring-ring"
          >
            {COUNTRIES.map((name) => {
              const code = dialFor(name);
              return (
                <option key={name} value={name}>
                  {code ? `${name} (${code})` : name}
                </option>
              );
            })}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("auth.phone")}</Label>
          <div className="flex">
            <span className="grid h-12 shrink-0 place-items-center rounded-none border border-r-0 border-input bg-secondary px-3 text-sm font-medium text-primary">
              {dialCode || "+"}
            </span>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
              className="h-12 rounded-none border-l-0"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("auth.creating")}
            </>
          ) : (
            t("auth.createAccount")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}