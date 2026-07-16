"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Check, X, Crown, Star } from "lucide-react";
import { useAdminData, type SubscriptionPlan } from "@/lib/admin-data-context";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionPlansPage() {
  const { subscriptionPlans, setSubscriptionPlans } = useAdminData();
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    duration: "monthly" as "weekly" | "monthly" | "yearly",
    price: "",
    currency: "RWF",
    features: "",
    popular: false,
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const featuresArray = formData.features.split("\n").filter(f => f.trim());

    const plan = {
      id: editingPlan ? editingPlan.id : `plan-${Date.now()}`,
      name: formData.name,
      duration: formData.duration,
      price: Number(formData.price),
      currency: formData.currency,
      features: featuresArray,
      popular: formData.popular,
      active: formData.active,
    };

    try {
      const response = await fetch("/api/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      const savedPlan = (await response.json()) as SubscriptionPlan;

      if (response.ok) {
        setSubscriptionPlans(
          editingPlan
            ? subscriptionPlans.map(p => (p.id === savedPlan.id ? savedPlan : p))
            : [...subscriptionPlans, savedPlan]
        );
      } else {
        console.error("Failed to save plan:", savedPlan);
      }
    } catch (error) {
      console.error("Error saving plan:", error);
    }

    resetForm();
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      duration: plan.duration,
      price: plan.price.toString(),
      currency: plan.currency,
      features: plan.features.join("\n"),
      popular: plan.popular || false,
      active: plan.active,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        const response = await fetch(`/api/subscription-plans?id=${deletingId}`, { method: "DELETE" });
        if (response.ok) {
          setSubscriptionPlans(subscriptionPlans.filter(p => p.id !== deletingId));
        } else {
          console.error("Failed to delete plan");
        }
      } catch (error) {
        console.error("Error deleting plan:", error);
      }
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      duration: "monthly",
      price: "",
      currency: "RWF",
      features: "",
      popular: false,
      active: true,
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
          <p className="text-muted">Manage premium subscription plans and pricing</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingPlan ? "Edit Plan" : "Add New Plan"}
            </h2>
            <Button variant="secondary" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Plan Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  placeholder="e.g. Monthly Premium"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value as any })}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Price</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  placeholder="e.g. 15000"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                >
                  <option value="RWF">RWF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Features (one per line)</label>
              <textarea
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue resize-none"
                placeholder="Access to all competitions&#10;Exclusive learning content&#10;Priority support"
                rows={4}
                required
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.popular}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Mark as Popular</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" type="button" onClick={resetForm}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingPlan ? "Update Plan" : "Add Plan"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-6 relative ${plan.popular ? "border-2 border-blue" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="blue" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Popular
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crown className={`h-5 w-5 ${plan.popular ? "text-yellow" : "text-muted"}`} />
                  <h3 className="font-semibold">{plan.name}</h3>
                </div>
                <Badge variant={plan.active ? "green" : "red"} className="text-xs">
                  {plan.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">{plan.price.toLocaleString()}</span>
                <span className="text-muted">/{plan.duration}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="text-sm text-muted flex items-start gap-2">
                    <Check className="h-4 w-4 text-green flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(plan)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleDelete(plan.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {deletingId && (
        <ConfirmDialog
          title="Delete Plan"
          message={<>Are you sure you want to delete <span className="font-semibold">{subscriptionPlans.find(p => p.id === deletingId)?.name}</span>?</>}
          confirmLabel="Delete Plan"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
