"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/admin/admin-modal";
import { Wallet, Building2, Smartphone, CheckCircle } from "lucide-react";

const RWANDAN_BANKS = [
  "Bank of Kigali",
  "BPR Bank Rwanda",
  "I&M Bank Rwanda",
  "Equity Bank Rwanda",
  "NCBA Bank Rwanda",
  "Cogebanque",
  "Zigama CSS",
  "UBA Rwanda",
  "Development Bank of Rwanda",
  "Ecobank Rwanda",
  "GTBank Rwanda",
  "KCB Bank Rwanda",
  "Access Bank Rwanda",
];

const WALLET_COMPANIES = ["MTN Momo", "Airtel Money"];

interface WithdrawalModalProps {
  onClose: () => void;
  userEmail: string;
  competitionTitle?: string | null;
}

export function WithdrawalModal({
  onClose,
  userEmail,
  competitionTitle,
}: WithdrawalModalProps) {
  const [method, setMethod] = useState<"mobile" | "bank" | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    profilePhoto: "",
    nationalId: "",
    homeAddress: "",
    nationality: "",
    walletCompany: "",
    walletNumber: "",
    bankName: "",
    accountNumber: "",
    termsAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    method &&
    form.fullName &&
    form.gender &&
    form.homeAddress &&
    form.nationality &&
    form.termsAccepted &&
    (method === "mobile"
      ? form.walletCompany && form.walletNumber
      : form.bankName && form.accountNumber);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          method,
          competitionTitle,
          ...form,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch (err) {
      console.error("Withdrawal submit error:", err);
      alert("Failed to submit withdrawal request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center py-6">
        <CheckCircle className="h-12 w-12 text-green mx-auto" />
        <CardTitle className="text-xl">Request Submitted</CardTitle>
        <p className="text-muted">
          Your withdrawal request has been received. Check your email for
          confirmation and next steps.
        </p>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CardTitle className="flex items-center gap-2 text-xl">
        <Wallet className="h-5 w-5 text-yellow" /> Withdraw Prize
      </CardTitle>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMethod("mobile")}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
            method === "mobile"
              ? "border-blue bg-blue/10 text-blue"
              : "border-white/10 hover:bg-white/5"
          }`}
        >
          <Smartphone className="h-6 w-6" />
          <span className="text-sm font-medium">Mobile Wallet</span>
        </button>
        <button
          type="button"
          onClick={() => setMethod("bank")}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
            method === "bank"
              ? "border-blue bg-blue/10 text-blue"
              : "border-white/10 hover:bg-white/5"
          }`}
        >
          <Building2 className="h-6 w-6" />
          <span className="text-sm font-medium">Bank Transfer</span>
        </button>
      </div>

      {method && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted mb-1 block">
              Full legal names *
            </label>
            <input
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
              className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="e.g. Jean Claude"
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Gender *</label>
            <div className="flex gap-4">
              {["Male", "Female"].map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="gender"
                    value={g.toLowerCase()}
                    checked={form.gender === g.toLowerCase()}
                    onChange={(e) => update("gender", e.target.value)}
                    required
                    className="accent-blue"
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">
                Profile photo
              </label>
              <ImageUpload
                value={form.profilePhoto}
                onChange={(url) => update("profilePhoto", url)}
                label="Profile Photo"
                aspectRatio="portrait"
                allowCrop={false}
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">
                National ID
              </label>
              <ImageUpload
                value={form.nationalId}
                onChange={(url) => update("nationalId", url)}
                label="National ID"
                aspectRatio="portrait"
                allowCrop={false}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">
              Home address *
            </label>
            <input
              value={form.homeAddress}
              onChange={(e) => update("homeAddress", e.target.value)}
              required
              className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="Your home address"
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">
              Nationality *
            </label>
            <input
              value={form.nationality}
              onChange={(e) => update("nationality", e.target.value)}
              required
              className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="e.g. Rwandan"
            />
          </div>

          {method === "mobile" ? (
            <>
              <div>
                <label className="text-sm text-muted mb-1 block">
                  Wallet company *
                </label>
                <select
                  value={form.walletCompany}
                  onChange={(e) => update("walletCompany", e.target.value)}
                  required
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                >
                  <option value="">Choose wallet</option>
                  {WALLET_COMPANIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">
                  Wallet number *
                </label>
                <input
                  value={form.walletNumber}
                  onChange={(e) => update("walletNumber", e.target.value)}
                  required
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  placeholder="e.g. 078..."
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm text-muted mb-1 block">
                  Bank name *
                </label>
                <select
                  value={form.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                  required
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                >
                  <option value="">Choose bank</option>
                  {RWANDAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">
                  Bank account number *
                </label>
                <input
                  value={form.accountNumber}
                  onChange={(e) => update("accountNumber", e.target.value)}
                  required
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  placeholder="Your bank account number"
                />
              </div>
            </>
          )}

          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.termsAccepted}
              onChange={(e) => update("termsAccepted", e.target.checked)}
              className="mt-1 accent-blue"
            />
            <span className="text-muted">
              I accept the terms and conditions. I confirm that the information
              provided is accurate and that prize delivery may take 3 to 5
              business days, with possible delays due to network providers or
              country restrictions.
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Submitting..." : "Submit Withdrawal Request"}
          </Button>
        </form>
      )}
    </div>
  );
}
