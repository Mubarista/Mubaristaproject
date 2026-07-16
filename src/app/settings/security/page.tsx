"use client";

import { useState, useEffect } from "react";
import { Mail, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SecuritySettingsPage() {
  const { user, resendVerificationEmail, reloadUser } = useAuth();
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(user?.emailVerified || false);

  useEffect(() => {
    // Reload user data when page loads to get latest verification status
    const loadUserData = async () => {
      await reloadUser();
      setIsEmailVerified(user?.emailVerified || false);
    };
    loadUserData();
  }, [reloadUser, user?.emailVerified]);

  const handleResendEmail = async () => {
    setSendingEmail(true);
    setMessage("");
    try {
      await resendVerificationEmail();
      await reloadUser();
      setIsEmailVerified(user?.emailVerified || false);
      setMessage("Verification email sent successfully!");
    } catch (error: any) {
      setMessage(error.message || "Failed to send verification email");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Settings</h1>
          <p className="text-muted">Secure your account with email verification</p>
        </div>

        <div className="space-y-6">
          {/* Email Verification */}
          <Card className="p-6">
            <CardTitle className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" /> Secure Your Account
            </CardTitle>
            <p className="text-muted mb-6">
              Verify your email for enhanced account security
            </p>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted-bg">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isEmailVerified ? 'bg-green/10' : 'bg-yellow/10'
                }`}>
                  {isEmailVerified ? (
                    <CheckCircle className="h-5 w-5 text-green" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-muted">
                    {user?.email || "No email"}
                  </p>
                  <p className={`text-xs mt-1 ${isEmailVerified ? 'text-green' : 'text-yellow'}`}>
                    {isEmailVerified ? 'Verified' : 'Not verified'}
                  </p>
                </div>
              </div>
              {!isEmailVerified && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleResendEmail}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? "Sending..." : "Verify Email"}
                </Button>
              )}
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                message.includes('success') ? 'bg-green/10 text-green' : 'bg-red/10 text-red'
              }`}>
                {message}
              </div>
            )}
          </Card>

          {/* Security Tips */}
          <Card className="p-6">
            <CardTitle className="mb-4">Security Tips</CardTitle>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green mt-0.5 flex-shrink-0" />
                <span>Keep your email verified to ensure account recovery options work</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green mt-0.5 flex-shrink-0" />
                <span>Use a strong, unique password for your account</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green mt-0.5 flex-shrink-0" />
                <span>Don't share your login credentials with anyone</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
