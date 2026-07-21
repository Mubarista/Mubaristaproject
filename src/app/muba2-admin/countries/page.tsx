"use client";

import { useState } from "react";
import { Star, Search } from "lucide-react";
import { useAdminData, type SupportedCountry } from "@/lib/admin-data-context";
import { AdminModal, Field, Input } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const blank: SupportedCountry = { name: "", code: "", dialCode: "", flag: "" };

export default function AdminCountriesPage() {
  const { supportedCountries, setSupportedCountries, defaultCountryCode, setDefaultCountryCode } = useAdminData();
  const [editing, setEditing] = useState<(SupportedCountry & { id: string }) | null>(null);
  const [draft, setDraft] = useState<SupportedCountry>(blank);
  const [deleting, setDeleting] = useState<(SupportedCountry & { id: string }) | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const indexed = supportedCountries.map((c, i) => ({ ...c, id: String(i) }));

  const filteredCountries = indexed.filter((c) => {
    const searchLower = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchLower) ||
      c.code.toLowerCase().includes(searchLower) ||
      c.dialCode.toLowerCase().includes(searchLower)
    );
  });

  function openAdd() { setDraft({ ...blank }); setEditing({ ...blank, id: "new" }); }
  function openEdit(c: SupportedCountry & { id: string }) {
    setDraft({ name: c.name, code: c.code, dialCode: c.dialCode, flag: c.flag });
    setEditing(c);
  }
  function closeModal() { setEditing(null); }

  async function save() {
    const next = [...supportedCountries];
    if (editing!.id === "new") {
      next.push(draft);
    } else {
      const idx = Number(editing!.id);
      next[idx] = draft;
    }
    setSupportedCountries(next);
    await updateSiteSettings(next, defaultCountryCode);
    closeModal();
  }

  async function updateSiteSettings(countries: SupportedCountry[], defaultCode: string) {
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportedCountries: countries, defaultCountryCode: defaultCode }),
      });
      if (!res.ok) throw new Error("Failed to save country settings");
    } catch (error) {
      console.error("Error saving country settings:", error);
      alert("Failed to save changes. Please try again.");
    }
  }

  function del(c: SupportedCountry & { id: string }) {
    if (c.code === defaultCountryCode) {
      setWarning("Cannot remove the default country. Set another country as default first.");
      setTimeout(() => setWarning(null), 3000);
      return;
    }
    setDeleting(c);
  }

  async function confirmDelete() {
    if (deleting) {
      const idx = Number(deleting.id);
      const next = supportedCountries.filter((_, i) => i !== idx);
      setSupportedCountries(next);
      await updateSiteSettings(next, defaultCountryCode);
      setDeleting(null);
    }
  }

  async function handleSetDefault(c: SupportedCountry & { id: string }) {
    const res = await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supportedCountries, defaultCountryCode: c.code }),
    });
    if (res.ok) {
      setDefaultCountryCode(c.code);
    } else {
      alert("Failed to update default country");
    }
  }

  const set = (k: keyof SupportedCountry) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const currentDefault = supportedCountries.find((c) => c.code === defaultCountryCode);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Supported Countries</h1>
        <p className="text-muted text-sm">
          Countries listed here appear in the registration form. The default country is pre-selected for new users.
        </p>
        {currentDefault && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow/10 border border-yellow/20 text-sm">
            <Star className="h-4 w-4 text-yellow fill-yellow" />
            <span>Default: <strong>{currentDefault.flag} {currentDefault.name}</strong> ({currentDefault.dialCode})</span>
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Countries ({filteredCountries.length})</h2>
        <Button variant="primary" size="sm" onClick={openAdd}>+ Add Country</Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search countries by name, code, or dial code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-muted font-medium">Country</th>
                <th className="text-left px-4 py-3 text-muted font-medium">Dial Code</th>
                <th className="text-left px-4 py-3 text-muted font-medium">Status</th>
                <th className="text-right px-4 py-3 text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCountries.map((c) => {
                const isDefault = c.code === defaultCountryCode;
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.flag}</span>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted uppercase tracking-widest">{c.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue bg-blue/10 px-2 py-1 rounded-lg text-sm">
                        {c.dialCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isDefault ? (
                        <Badge variant="yellow">
                          <Star className="h-3 w-3 fill-current mr-1" /> Default
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {!isDefault && (
                          <button
                            onClick={() => handleSetDefault(c)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-yellow/10 text-yellow transition-colors"
                            title="Set as default"
                          >
                            <Star className="h-3.5 w-3.5" /> Set Default
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 rounded-lg hover:bg-blue/10 text-blue transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => del(c)}
                          className="p-2 rounded-lg hover:bg-red/10 text-red transition-colors"
                          disabled={isDefault}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <AdminModal
          title={editing.id === "new" ? "Add Country" : "Edit Country"}
          onClose={closeModal}
          onSave={save}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Country Name" required>
              <Input value={draft.name} onChange={set("name")} placeholder="Rwanda" />
            </Field>
            <Field label="ISO Code (2 letters)">
              <Input value={draft.code} onChange={set("code")} placeholder="RW" maxLength={2} className="uppercase" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dial Code">
              <Input value={draft.dialCode} onChange={set("dialCode")} placeholder="+250" />
            </Field>
            <Field label="Flag Emoji">
              <Input value={draft.flag} onChange={set("flag")} placeholder="Enter Flag Emoji" />
            </Field>
          </div>
          <p className="text-xs text-muted mt-1">
            Tip: paste the flag emoji directly or use your OS emoji picker (🌐 or Ctrl+.).
          </p>
        </AdminModal>
      )}

      {warning && (
        <div className="fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg bg-red text-white text-sm">
          {warning}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Remove Country"
          message={<>Are you sure you want to remove <span className="font-semibold">{deleting.flag} {deleting.name}</span> from supported countries?</>}
          confirmLabel="Remove Country"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
