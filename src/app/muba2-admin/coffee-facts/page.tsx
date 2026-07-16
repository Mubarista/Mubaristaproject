"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { LoadingDots } from "@/components/ui/loading-dots";

const blank = { id: "", fact: "", icon: "☕" };

export default function AdminCoffeeFactsPage() {
  const [coffeeFacts, setCoffeeFacts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>(blank);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCoffeeFacts();
  }, []);

  async function fetchCoffeeFacts() {
    try {
      const res = await fetch("/api/coffee-facts");
      const data = await res.json();
      setCoffeeFacts(data);
    } catch (error) {
      console.error("Error fetching coffee facts:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { const d = { ...blank, id: String(Date.now()) }; setDraft(d); setEditing(d); }
  function openEdit(f: any) { setDraft({ ...f }); setEditing(f); }
  function closeModal() { setEditing(null); }

  async function save() {
    setSaving(true);
    try {
      const exists = coffeeFacts.find((f) => f.id === draft.id);
      const method = exists ? "PUT" : "POST";
      const res = await fetch("/api/coffee-facts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await fetchCoffeeFacts();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving coffee fact:", error);
    } finally {
      setSaving(false);
    }
  }

  function del(f: any) {
    setDeleting(f);
  }

  const filteredCoffeeFacts = coffeeFacts.filter(f =>
    f.fact.toLowerCase().includes(search.toLowerCase())
  );

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/coffee-facts?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchCoffeeFacts();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting coffee fact:", error);
      }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Coffee Facts</h1>
        <p className="text-muted text-sm">Manage the rotating coffee facts shown on the homepage.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search coffee facts by content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingDots />
        </div>
      ) : (
        <AdminTable
          title={`Coffee Facts (${filteredCoffeeFacts.length})`}
          items={filteredCoffeeFacts}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={del}
          columns={[
            { label: "Icon", render: (f) => <span className="text-2xl">{f.icon}</span> },
            { label: "Fact", render: (f) => <span className="text-sm line-clamp-2">{f.fact}</span> },
          ]}
        />
      )}

      {editing && (
        <AdminModal
          title={coffeeFacts.find((f: any) => f.id === draft.id) ? "Edit Coffee Fact" : "Add Coffee Fact"}
          onClose={closeModal}
          onSave={save}
        >
          <Field label="Emoji Icon">
            <Input value={draft.icon} onChange={(e) => setDraft((d: any) => ({ ...d, icon: e.target.value }))} placeholder="☕" />
          </Field>
          <Field label="Fact" required>
            <Textarea value={draft.fact} onChange={(e) => setDraft((d: any) => ({ ...d, fact: e.target.value }))} rows={4} />
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Coffee Fact"
          message="Are you sure you want to delete this coffee fact?"
          confirmLabel="Delete Fact"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
