"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, Select } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

const blank: Omit<Tip, 'id' | 'createdAt' | 'updatedAt'> = { 
  title: "", 
  content: "", 
  category: "Espresso", 
  author: ""
};

const categories = ["Latte Art", "Steaming", "Espresso", "Competition", "Maintenance", "Brewing"];

export default function AdminTipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tip | null>(null);
  const [draft, setDraft] = useState<Omit<Tip, 'id' | 'createdAt' | 'updatedAt'>>(blank);
  const [deleting, setDeleting] = useState<Tip | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTips();
  }, []);

  async function fetchTips() {
    try {
      const res = await fetch("/api/tips");
      if (res.ok) {
        const data = await res.json();
        setTips(data);
      }
    } catch (error) {
      console.error("Error fetching tips:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { 
    setDraft({ ...blank }); 
    setEditing({ ...blank, id: "new", createdAt: "", updatedAt: "" }); 
  }

  function openEdit(tip: Tip) { 
    setDraft({ 
      title: tip.title, 
      content: tip.content, 
      category: tip.category, 
      author: tip.author
    }); 
    setEditing(tip); 
  }

  function del(tip: Tip) { setDeleting(tip); }

  function closeModal() { setEditing(null); }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const method = editing.id === "new" ? "POST" : "PUT";
      const body = editing.id === "new" ? draft : { ...draft, id: editing.id };
      
      const res = await fetch("/api/tips", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchTips();
        closeModal();
      } else {
        console.error("Save failed:", await res.text());
      }
    } catch (error) {
      console.error("Error saving tip:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting) {
      setDeletingId(deleting.id);
      // Optimistic update - remove from UI immediately
      setTips(prev => prev.filter(t => t.id !== deleting.id));
      
      try {
        const res = await fetch(`/api/tips?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          // Revert if failed
          await fetchTips();
        }
      } catch (error) {
        console.error("Error deleting tip:", error);
        // Revert on error
        await fetchTips();
      } finally {
        setDeletingId(null);
        setDeleting(null);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingDots />
      </div>
    );
  }

  const filteredTips = tips.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tips & Skills</h1>
        <p className="text-muted text-sm">Manage barista tips and skills content.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search tips by title, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <AdminTable
        title={`Tips (${filteredTips.length})`}
        items={filteredTips}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={del}
        columns={[
          { label: "Title", render: (t) => <span className="font-medium">{t.title}</span> },
          { label: "Category", render: (t) => <span className="text-xs px-2 py-0.5 rounded-full bg-blue/10 text-blue">{t.category}</span> },
          { label: "Author", render: (t) => <span className="text-muted text-xs">{t.author || "-"}</span> },
        ]}
      />

      {editing && (
        <AdminModal title={editing.id === "new" ? "Add Tip" : "Edit Tip"} onClose={closeModal} onSave={save}>
          <Field label="Title" required>
            <Input value={draft.title} onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} />
          </Field>
          <Field label="Content" required>
            <Textarea value={draft.content} onChange={(e) => setDraft(d => ({ ...d, content: e.target.value }))} rows={4} />
          </Field>
          <Field label="Category" required>
            <Select 
              value={draft.category} 
              onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
              options={categories.map(c => ({ value: c, label: c }))}
            />
          </Field>
          <Field label="Author">
            <Input value={draft.author} onChange={(e) => setDraft(d => ({ ...d, author: e.target.value }))} placeholder="Author name" />
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Tip"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.title}</span>? This action cannot be undone.</>}
          confirmLabel="Delete Tip"
          isLoading={deletingId === deleting.id}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
