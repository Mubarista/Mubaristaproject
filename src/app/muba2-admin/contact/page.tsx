"use client";

import { useState, useEffect } from "react";
import { AdminModal, Field, Input } from "@/components/admin/admin-modal";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { validatePhoneNumber } from "@/lib/phone-utils";
import { Save } from "lucide-react";

interface ContactInfo {
  id: string;
  email: string;
  phone: string;
  location: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContactPage() {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    email: "",
    phone: "",
    location: ""
  });

  useEffect(() => {
    fetchContact();
  }, []);

  async function fetchContact() {
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setContact(data);
          setDraft({
            email: data.email,
            phone: data.phone,
            location: data.location
          });
        }
      }
    } catch (error) {
      console.error("Error fetching contact info:", error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    const validation = validatePhoneNumber(draft.phone);
    if (!validation.valid) {
      setPhoneError(validation.error || "Enter a valid phone number");
      return;
    }
    setPhoneError(null);
    setSaving(true);
    try {
      const method = contact ? "PUT" : "PUT";
      const body = contact ? { ...draft, id: contact.id } : draft;

      const res = await fetch("/api/contact", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchContact();
      }
    } catch (error) {
      console.error("Error saving contact info:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Contact Page</h1>
        <p className="text-muted text-sm">Manage the Contact page information.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-6">
        <Field label="Email" required>
          <Input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft(d => ({ ...d, email: e.target.value }))}
            placeholder="hello@mubarista.com"
          />
        </Field>

        <Field label="Phone" required>
          <PhoneInput
            value={draft.phone}
            onChange={(value) => {
              setDraft(d => ({ ...d, phone: value }));
              setPhoneError(null);
            }}
            placeholder="788 000 000"
            required
          />
          {phoneError && (
            <p className="text-xs text-red mt-1">{phoneError}</p>
          )}
        </Field>

        <Field label="Location" required>
          <Input
            value={draft.location}
            onChange={(e) => setDraft(d => ({ ...d, location: e.target.value }))}
            placeholder="Kigali, Rwanda · Global"
          />
        </Field>

        <div className="flex justify-end">
          <Button onClick={save} loading={saving} loadingText="Saving...">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
