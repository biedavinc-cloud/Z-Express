import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useI18n } from "@/components/LanguageProvider";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useAuth } from "@/lib/AuthContext";
import { homeFor, resolveSession } from "@/lib/session";

export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();
  const { isAuthenticated, authChecked } = useAuth();
  const redirecting = useRef(false);

  // Once a session exists (password, Google, or an already-signed-in visitor),
  // go to the requested page, or to the home that fits the person's role.
  useEffect(() => {
    if (!authChecked || !isAuthenticated || redirecting.current) return;
    redirecting.current = true;
    (async () => {
      const destination = returnTo !== "/" ? returnTo : homeFor(await resolveSession());
      window.location.replace(destination);
    })();
  }, [authChecked, isAuthenticated, returnTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // The effect above performs the redirect as soon as the session is live.
      await api.auth.loginViaEmailPassword(email, password);
    } catch (err) {
      setError(err.message || t("auth.invalidCredentials"));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await api.auth.loginWithProvider("google", returnTo);
    } catch (err) {
      setError(err.message || t("auth.invalidCredentials"));
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title={t("auth.welcomeBack")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.createOne")}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("auth.loggingIn")}
            </>
          ) : (
            t("auth.login")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}