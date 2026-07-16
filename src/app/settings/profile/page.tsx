"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  User,
  Mail,
  Globe,
  Camera,
  Phone,
  Save,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  Home,
  Store,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAdminData } from "@/lib/admin-data-context";
import { supabase } from "@/lib/supabase";

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

export default function ProfileSettingsPage() {
  const { user, reloadUser } = useAuth();
  const { supportedCountries, defaultCountryCode } = useAdminData();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"delivery" | "pickup">("delivery");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addressSaving, setAddressSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countryOptions =
    supportedCountries.length > 0
      ? supportedCountries
      : [{ name: "Rwanda", code: defaultCountryCode || "RW", flag: "🇷🇼", dialCode: "+250" }];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        country: user.country || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, country: prev.country || defaultCountryCode || "" }));
  }, [defaultCountryCode]);

  async function fetchAddresses() {
    if (!user) return;
    try {
      setAddressLoading(true);
      const res = await fetch(`/api/addresses?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data as Address[]);
      }
    } catch (err) {
      console.error("Failed to fetch addresses", err);
    } finally {
      setAddressLoading(false);
    }
  }

  useEffect(() => {
    fetchAddresses();
    const interval = setInterval(() => {
      fetchAddresses();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const { name, email, country, phone } = formData;

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, name, country, phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const authUpdate: { email?: string; data: { name: string; country: string; phone: string } } = {
        data: { name, country, phone },
      };
      if (email !== user.email) {
        authUpdate.email = email;
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdate);
      if (authError) throw authError;

      await reloadUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  function openAdd() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      type: activeTab,
      country: defaultCountryCode || "",
    });
    setAddressError(null);
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
    setAddressError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setAddressError(null);
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setAddressSaving(true);
    setAddressError(null);

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
      setAddressError(err.message || "Failed to save address");
    } finally {
      setAddressSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be less than 5MB");
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      // Step 1: Upload the file to storage via /api/upload
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("type", "photo");
      uploadFormData.append("maxWidth", "400");
      uploadFormData.append("maxHeight", "400");
      uploadFormData.append("quality", "90");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to upload image");
      }

      const { url } = await uploadRes.json();

      // Step 2: Save the avatar URL to the database
      const updateRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, avatar: url }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update profile photo");
      }

      // Step 3: Update auth user metadata so it persists across sessions
      await supabase.auth.updateUser({ data: { avatar: url } });

      // Step 4: Reload user in context so the avatar shows everywhere
      await reloadUser();
    } catch (err: any) {
      setAvatarError(err.message || "Failed to upload profile photo");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  const filtered = useMemo(
    () => addresses.filter((a) => a.type === activeTab),
    [addresses, activeTab]
  );

  const renderAddressList = (list: Address[], type: "delivery" | "pickup") => {
    if (addressLoading && addresses.length === 0) {
      return <p className="text-muted text-center py-12">Loading addresses...</p>;
    }
    if (list.length === 0) {
      return (
        <div className="text-center py-5">
          <MapPin className="h-6 w-6 text-muted mx-auto mb-2" />
          <p className="text-muted text-xs">
            No {type === "delivery" ? "delivery addresses" : "pickup points"} yet.
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={openAdd}>
            <Plus className="h-3 w-3" /> Add one
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((address) => {
          const countryName =
            countryOptions.find((c) => c.code === address.country)?.name || address.country;
          return (
            <Card key={address.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base truncate">{address.label}</CardTitle>
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
                    {address.city}, {countryName} {address.zipCode}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(address)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(address.id)}>
                    <Trash2 className="h-4 w-4 text-red" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {!address.isDefault && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setDefault(address.id)}>
                    <Star className="h-4 w-4 mr-1" /> Set as Default
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted">Update your personal information</p>
        </div>

        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <Card className="p-6">
            <CardTitle className="mb-4">Profile Photo</CardTitle>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-muted-bg flex items-center justify-center overflow-hidden shrink-0">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-muted" />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {avatarUploading ? "Uploading..." : user?.avatar ? "Change Photo" : "Upload Photo"}
                </Button>
                <p className="text-xs text-muted mt-2">
                  {avatarUploading
                    ? "Uploading your photo..."
                    : "PNG, JPG or WEBP. Max 5MB."}
                </p>
                {avatarError && (
                  <p className="text-xs text-red mt-2">{avatarError}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card className="p-6">
            <CardTitle className="mb-4">Personal Information</CardTitle>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Country</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue appearance-none"
                  >
                    <option value="">Select your country</option>
                    {supportedCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Phone</label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="Enter your phone number"
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>
            </div>
          </Card>
        </form>

        {/* Addresses */}
        <Card className="p-3 mt-3 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <CardTitle className="text-base">Addresses</CardTitle>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "delivery" | "pickup")}>
            <TabsList>
              <TabsTrigger value="delivery">Delivery Addresses</TabsTrigger>
              <TabsTrigger value="pickup">Pickup Points</TabsTrigger>
            </TabsList>

            <TabsContent value="delivery">{renderAddressList(filtered, "delivery")}</TabsContent>
            <TabsContent value="pickup">{renderAddressList(filtered, "pickup")}</TabsContent>
          </Tabs>
        </Card>

        <Button
          type="submit"
          form="profile-form"
          variant="primary"
          disabled={loading}
          className="w-full mt-6"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>

        {saved && (
          <p className="text-sm text-green text-center mt-4">Profile updated successfully</p>
        )}

        {error && (
          <p className="text-sm text-red text-center mt-4">{error}</p>
        )}
      </div>

      {/* Address Modal */}
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

            <form onSubmit={handleAddressSubmit} className="space-y-4">
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
                  required
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

              {/* City / Zip */}
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

              {/* Country */}
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

              {addressError && <p className="text-sm text-red text-center">{addressError}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1" loading={addressSaving}>
                  {editing ? "Save Changes" : "Add Address"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
