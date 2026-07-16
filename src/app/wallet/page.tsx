"use client";

import { useState, useEffect } from "react";
import { Wallet, ArrowRight, CreditCard, Globe, CheckCircle, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState({
    method: "",
    amount: "",
    bankName: "",
    accountNumber: "",
    iban: "",
    accountHolder: "",
    destinationCountry: "",
    westernUnionId: "",
  });

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  async function fetchWalletData() {
    try {
      const walletResponse = await fetch(`/api/wallet?userId=${user?.id}`);
      if (walletResponse.ok) {
        const data = await walletResponse.json();
        setWallet(data);
      }

      const withdrawalsResponse = await fetch(`/api/wallet/withdrawals?userId=${user?.id}`);
      if (withdrawalsResponse.ok) {
        const data = await withdrawalsResponse.json();
        setWithdrawals(data);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdrawal() {
    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          ...withdrawalData,
          amount: parseFloat(withdrawalData.amount),
        }),
      });

      if (response.ok) {
        setShowWithdrawForm(false);
        setWithdrawalData({
          method: "",
          amount: "",
          bankName: "",
          accountNumber: "",
          iban: "",
          accountHolder: "",
          destinationCountry: "",
          westernUnionId: "",
        });
        fetchWalletData();
      } else {
        alert("Failed to submit withdrawal request");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Failed to submit withdrawal request");
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold mb-2">Your Wallet</h1>
        <p className="text-muted mb-8">Manage your competition winnings and withdrawals</p>

        {/* Balance Card */}
        <Card className="mb-8 p-6 bg-gradient-to-br from-blue/20 to-purple/20 border-blue/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Available Balance</p>
              <p className="text-4xl font-bold">
                RWF {(wallet?.balance || 0).toFixed(0)}
              </p>
              <p className="text-sm text-muted mt-1">{wallet?.currency || "RWF"}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-blue/10 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-blue" />
            </div>
          </div>
        </Card>

        {/* Withdrawal Form */}
        {showWithdrawForm && (
          <Card className="mb-8 p-6">
            <CardTitle className="mb-4">Request Withdrawal</CardTitle>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Withdrawal Method</label>
                <select
                  value={withdrawalData.method}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, method: e.target.value })}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                >
                  <option value="">Select method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="western_union">Western Union</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Amount</label>
                <input
                  type="number"
                  value={withdrawalData.amount}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                  max={wallet?.balance || 0}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-muted mt-1">Available: RWF {(wallet?.balance || 0).toFixed(0)}</p>
              </div>

              {withdrawalData.method === "bank_transfer" && (
                <>
                  <div>
                    <label className="text-sm text-muted mb-1 block">Bank Name</label>
                    <input
                      type="text"
                      value={withdrawalData.bankName}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, bankName: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1 block">Account Number</label>
                    <input
                      type="text"
                      value={withdrawalData.accountNumber}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, accountNumber: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1 block">IBAN</label>
                    <input
                      type="text"
                      value={withdrawalData.iban}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, iban: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      placeholder="Enter IBAN"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1 block">Account Holder Name</label>
                    <input
                      type="text"
                      value={withdrawalData.accountHolder}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, accountHolder: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      placeholder="Iraguha Mugisha"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1 block">Destination Country</label>
                    <input
                      type="text"
                      value={withdrawalData.destinationCountry}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, destinationCountry: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      placeholder="Enter destination country"
                    />
                  </div>
                </>
              )}

              {withdrawalData.method === "western_union" && (
                <>
                  <div>
                    <label className="text-sm text-muted mb-1 block">Western Union ID</label>
                    <input
                      type="text"
                      value={withdrawalData.westernUnionId}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, westernUnionId: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      placeholder="Enter Western Union ID"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={withdrawalData.accountHolder}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, accountHolder: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      placeholder="Iraguha Mugisha"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1 block">Destination Country</label>
                    <input
                      type="text"
                      value={withdrawalData.destinationCountry}
                      onChange={(e) => setWithdrawalData({ ...withdrawalData, destinationCountry: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      placeholder="Enter destination country"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowWithdrawForm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleWithdrawal}>
                  Submit Request
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!showWithdrawForm && (
          <Button
            variant="premium"
            className="w-full mb-8"
            onClick={() => setShowWithdrawForm(true)}
            disabled={!wallet || wallet.balance <= 0}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Request Withdrawal
          </Button>
        )}

        {/* Withdrawal History */}
        <Card>
          <CardTitle className="mb-4">Withdrawal History</CardTitle>
          {withdrawals.length > 0 ? (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="p-4 rounded-xl bg-muted-bg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue" />
                      </div>
                      <div>
                        <p className="font-medium">RWF {withdrawal.amount.toFixed(0)}</p>
                        <p className="text-xs text-muted">{withdrawal.method.replace("_", " ").toUpperCase()}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        withdrawal.status === "completed"
                          ? "green"
                          : withdrawal.status === "processing"
                          ? "blue"
                          : withdrawal.status === "rejected"
                          ? "red"
                          : "yellow"
                      }
                    >
                      {withdrawal.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {withdrawal.status === "pending" && (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>Processing time: 3-5 business days</span>
                      </>
                    )}
                    {withdrawal.status === "completed" && (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed on {new Date(withdrawal.completedAt).toLocaleDateString()}</span>
                      </>
                    )}
                    {withdrawal.status === "rejected" && (
                      <>
                        <XCircle className="h-3 w-3" />
                        <span>{withdrawal.rejectionReason || "Rejected"}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No withdrawal history</p>
          )}
        </Card>
      </div>
    </div>
  );
}
