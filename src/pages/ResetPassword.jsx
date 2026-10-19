import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useI18n } from "@/components/LanguageProvider";
import { useAuth } from "@/lib/AuthContext";

export default function ResetPassword() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isPasswordRecovery, authChecked } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [waited, setWaited] = useState(false);

  // The email link carries a one-time code that the auth client exchanges for a
  // recovery session. Give that exchange a moment before calling the link invalid.
  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const linkFailed = Boolean(hash.get("error") || searchParams.get("error"));
  const hasSession = isPasswordRecovery || isAuthenticated;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await api.auth.updatePassword(newPassword);
      // End the recovery session so the person signs in with the new password.
      await api.auth.logout("/login");
    } catch (err) {
      setError(err.message || t("auth.resetFailed"));
      setLoading(false);
    }
  };

  if (!hasSession && !linkFailed && (!authChecked || !waited)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={t("auth.invalidLink")}
        subtitle={t("auth.invalidLinkSubtitle")}
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            {t("auth.requestNewLink")}
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          {t("auth.invalidLinkBody")}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title={t("auth.newPasswordTitle")}
      subtitle={t("auth.newPasswordSubtitle")}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.newPassword")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              {t("auth.resetting")}
            </>
          ) : (
            t("auth.resetButton")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}