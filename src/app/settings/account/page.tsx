"use client";

import { useState } from "react";
import { Lock, Key, Save, Eye, EyeOff, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function AccountSettingsPage() {
  const { user, deleteAccount, isLoading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.newPassword) {
      setError("Please enter a new password");
      return;
    }

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (authError) throw authError;

      setSaved(true);
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm account deletion');
      return;
    }

    try {
      await deleteAccount();
      alert("Your account has been successfully deleted.");
      router.push("/");
    } catch (error: any) {
      alert(error.message || "Failed to delete account. Please try again.");
    }
  };

  const handleFirstConfirm = () => {
    setShowFirstConfirm(false);
    setShowSecondConfirm(true);
  };

  const handleSecondConfirm = () => {
    setShowSecondConfirm(false);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setShowFirstConfirm(false);
    setShowSecondConfirm(false);
    setDeleteConfirmText("");
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted">Manage your account security and preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Change Password */}
          <Card className="p-6">
            <CardTitle className="mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" /> Change Password
            </CardTitle>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Current Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Account Actions */}
          <Card className="p-6">
            <CardTitle className="mb-4">Account Actions</CardTitle>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted-bg">
                <div>
                  <p className="font-medium">Download My Data</p>
                  <p className="text-sm text-muted">Get a copy of your personal data</p>
                </div>
                <Button variant="secondary" size="sm" disabled>
                  Download
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-red/10 border border-red/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-red flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Delete Account
                    </p>
                    <p className="text-sm text-muted mt-1">Permanently delete your account and all data</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-red hover:bg-red/90"
                    onClick={() => setShowFirstConfirm(true)}
                  >
                    Delete
                  </Button>
                </div>

                {showDeleteConfirm && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted">
                      Type <span className="font-mono font-bold text-red">DELETE</span> to confirm account deletion:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full rounded-xl bg-muted-bg border border-red/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red"
                      placeholder="Type DELETE"
                    />
                    <Button
                      variant="primary"
                      className="w-full bg-red hover:bg-red/90"
                      onClick={handleDeleteAccount}
                      disabled={isLoading || deleteConfirmText !== "DELETE"}
                    >
                      {isLoading ? "Deleting..." : "Permanently Delete Account"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Button variant="primary" type="submit" disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>

          {saved && (
            <p className="text-sm text-green text-center">Password updated successfully</p>
          )}

          {error && (
            <p className="text-sm text-red text-center">{error}</p>
          )}
        </form>
      </div>

      {/* First Confirmation Modal */}
      {showFirstConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-xl font-bold mb-4">Delete Account</h3>
            <p className="text-muted mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={cancelDelete}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red hover:bg-red/90"
                onClick={handleFirstConfirm}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation Modal */}
      {showSecondConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-xl font-bold mb-4 text-red">Final Warning</h3>
            <p className="text-muted mb-6">
              This is your last chance. Your account and all data will be permanently deleted. Continue?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={cancelDelete}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red hover:bg-red/90"
                onClick={handleSecondConfirm}
              >
                Yes, Delete My Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Type DELETE Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-red/30">
            <h3 className="text-xl font-bold mb-4 text-red">Confirm Account Deletion</h3>
            <p className="text-muted mb-4">
              Type <span className="font-mono font-bold text-red">DELETE</span> to confirm account deletion:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-xl bg-muted-bg border border-red/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red mb-4"
              placeholder="Type DELETE"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={cancelDelete}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red hover:bg-red/90"
                onClick={handleDeleteAccount}
                disabled={isLoading || deleteConfirmText !== "DELETE"}
              >
                {isLoading ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
