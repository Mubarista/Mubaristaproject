"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAdminData } from "@/lib/admin-data-context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { register, loginWithGoogle, isLoading } = useAuth();
  const { supportedCountries, defaultCountryCode } = useAdminData();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        setLogoUrl(data?.logo || null);
        setLogoLoading(false);
      })
      .catch(() => setLogoLoading(false));
  }, []);

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  useEffect(() => {
    if (defaultCountryCode) setCountry(defaultCountryCode);
  }, [defaultCountryCode]);

  // Real-time email validation
  useEffect(() => {
    const validateEmail = async () => {
      if (!email || !email.includes("@")) {
        setEmailError("");
        return;
      }
      if (!email.endsWith("@gmail.com")) {
        setEmailError("Only Gmail addresses (@gmail.com) are allowed");
        return;
      }
      try {
        const response = await fetch("/api/users/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const result = await response.json();
        if (result.exists) {
          setEmailError("This email is already registered");
        } else {
          setEmailError("");
        }
      } catch (error) {
        console.error("Email validation failed:", error);
      }
    };

    const debounceTimer = setTimeout(validateEmail, 500);
    return () => clearTimeout(debounceTimer);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (emailError) {
      setError(emailError);
      return;
    }

    try {
      await register(email, password, name, "", country);
      setError("");
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push("/login");
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // loginWithGoogle redirects to Google OAuth; the redirectTo URL handles the return
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden bg-muted-bg mx-auto mb-4">
            {logoLoading ? (
              <div className="h-7 w-7 rounded-full border-2 border-muted border-t-transparent animate-spin" />
            ) : logoUrl ? (
              <img src={logoUrl} alt="MUBARISTA" className="h-full w-full object-contain" />
            ) : null}
          </div>
          <CardTitle className="text-2xl mb-1">Join MUBARISTA</CardTitle>
          <p className="text-muted text-sm">Create your account and start competing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted mb-1 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="Iraguha Mugisha"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Email (@gmail.com only)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="iraguha.mugisha@gmail.com"
              />
            </div>
            {emailError && (
              <p className="text-sm text-red-500 mt-1">{emailError}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="••••••••"
              />
            </div>
            {password && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted">Password requirements:</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-500' : 'text-red-500'}`}>
                    {passwordRequirements.minLength ? '✓' : '✗'} 8+ characters
                  </span>
                  <span className={`text-xs ${passwordRequirements.hasUpper ? 'text-green-500' : 'text-red-500'}`}>
                    {passwordRequirements.hasUpper ? '✓' : '✗'} Uppercase
                  </span>
                  <span className={`text-xs ${passwordRequirements.hasLower ? 'text-green-500' : 'text-red-500'}`}>
                    {passwordRequirements.hasLower ? '✓' : '✗'} Lowercase
                  </span>
                  <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-500' : 'text-red-500'}`}>
                    {passwordRequirements.hasNumber ? '✓' : '✗'} Number
                  </span>
                  <span className={`text-xs ${passwordRequirements.hasSpecial ? 'text-green-500' : 'text-red-500'}`}>
                    {passwordRequirements.hasSpecial ? '✓' : '✗'} Special
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
            >
              <option value="">Select country</option>
              {supportedCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red/10 border border-red/30 rounded-lg p-3 text-sm text-red">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-4"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </div>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue hover:underline">
            Sign in
          </Link>
        </p>
      </Card>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-green/30">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/10 border border-green/30">
                <svg className="h-8 w-8 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Registration Successful!</h3>
              <p className="text-muted">
                Please check your email for a verification link. You need to verify your email before you can access your account.
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={handleSuccessModalClose}
            >
              Go to Login
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
