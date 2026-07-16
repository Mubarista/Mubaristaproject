"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  Phone,
  Globe,
  Home,
  Store,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAdminData } from "@/lib/admin-data-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Address {
  id: string;
  userId: string;
  type: "delivery" | "pickup";
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  zipCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  type: "delivery" as "delivery" | "pickup",
  label: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  country: "",
  zipCode: "",
  isDefault: false,
};

export default function AddressesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { supportedCountries, defaultCountryCode } = useAdminData();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"delivery" | "pickup">("delivery");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const countryOptions = supportedCountries.length > 0 ? supportedCountries : [
    { name: "Rwanda", code: defaultCountryCode || "RW", flag: "🇷🇼", dialCode: "+250" },
  ];

  useEffect(() => {
    setForm((prev) => ({ ...prev, country: prev.country || defaultCountryCode || "" }));
  }, [defaultCountryCode]);

  async function fetchAddresses() {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/addresses?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data as Address[]);
      }
    } catch (err) {
      console.error("Failed to fetch addresses", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAddresses();
    const interval = setInterval(() => {
      fetchAddresses();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const filtered = useMemo(
    () => addresses.filter((a) => a.type === activeTab),
    [addresses, activeTab]
  );

  if (!user) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-muted">Please log in to manage your addresses</p>
      </div>
    );
  }

  if (user.role === "admin") {
    router.push("/muba2-admin");
    return null;
  }

  function openAdd() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      type: activeTab,
      country: defaultCountryCode || "",
    });
    setShowModal(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setForm({
      type: address.type,
      label: address.label || "",
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      country: address.country || "",
      zipCode: address.zipCode || "",
      isDefault: address.isDefault,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        userId: user.id,
      };

      const res = await fetch("/api/addresses", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save address");
      }

      closeModal();
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete address");
      }
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message || "Failed to delete address");
    }
  }

  async function setDefault(id: string) {
    try {
      const res = await fetch("/api/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set default");
      }
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message || "Failed to set default");
    }
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Addresses</h1>
            <p className="text-muted">Manage delivery addresses and pickup points</p>
          </div>
          <Button variant="primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add New Address
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "delivery" | "pickup")}>
          <TabsList>
            <TabsTrigger value="delivery">Delivery Addresses</TabsTrigger>
            <TabsTrigger value="pickup">Pickup Points</TabsTrigger>
          </TabsList>

          <TabsContent value="delivery">
            {renderAddressList(filtered, "delivery")}
          </TabsContent>
          <TabsContent value="pickup">
            {renderAddressList(filtered, "pickup")}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>{editing ? "Edit Address" : "Add New Address"}</CardTitle>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-muted-bg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="text-sm text-muted mb-1 block">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "delivery" | "pickup" })}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue appearance-none"
                >
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>

              {/* Label */}
              <div>
                <label className="text-sm text-muted mb-1 block">
                  {form.type === "pickup" ? "Pickup Point Name" : "Label"}
                </label>
                <div className="relative">
                  {form.type === "pickup" ? (
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  ) : (
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  )}
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder={form.type === "pickup" ? "e.g. Main Store" : "e.g. Home, Work"}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    required
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-sm text-muted mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm text-muted mb-1 block">Phone</label>
                <PhoneInput
                  value={form.phone}
                  onChange={(value) => setForm({ ...form, phone: value })}
                  placeholder="Enter phone number"
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="text-sm text-muted mb-1 block">
                  {form.type === "pickup" ? "Pickup Location" : "Address Line 1"}
                </label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  required
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="text-sm text-muted mb-1 block">Address Line 2</label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>

              {/* City / Country / Zip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted mb-1 block">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Zip Code</label>
                  <input
                    type="text"
                    value={form.zipCode}
                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Country</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue appearance-none"
                    required
                  >
                    <option value="">Select country</option>
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Is Default */}
              <label className="flex items-center gap-3 rounded-xl bg-muted-bg border border-white/10 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10 bg-muted-bg text-blue focus:ring-blue"
                />
                <span className="text-sm">Set as default {form.type} address</span>
              </label>

              {error && <p className="text-sm text-red text-center">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" type="button" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" className="flex-1" loading={saving}>
                  {editing ? "Save Changes" : "Add Address"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );

  function renderAddressList(list: Address[], type: "delivery" | "pickup") {
    if (loading && addresses.length === 0) {
      return <p className="text-muted text-center py-12">Loading addresses...</p>;
    }
    if (list.length === 0) {
      return (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-muted">
            No {type === "delivery" ? "delivery addresses" : "pickup points"} yet.
          </p>
          <Button variant="outline" className="mt-4" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add one
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((address) => (
          <Card key={address.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base truncate">
                    {address.label}
                  </CardTitle>
                  {address.isDefault && (
                    <Badge variant="green" className="text-xs">
                      <Star className="h-3 w-3 mr-1" /> Default
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium">{address.fullName}</p>
                <p className="text-sm text-muted">{address.phone}</p>
                <p className="text-sm text-muted mt-2">
                  {address.addressLine1}
                  {address.addressLine2 && <>, {address.addressLine2}</>}
                </p>
                <p className="text-sm text-muted">
                  {address.city}, {address.country} {address.zipCode}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(address)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(address.id)}>
                  <Trash2 className="h-4 w-4 text-red" />
                </Button>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {!address.isDefault && (
                <Button variant="outline" size="sm" onClick={() => setDefault(address.id)}>
                  <Star className="h-4 w-4 mr-1" /> Set as Default
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }
}
