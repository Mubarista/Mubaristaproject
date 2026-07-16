"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, ImageUpload } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { LoadingDots } from "@/components/ui/loading-dots";

interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const blank: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'> = { year: "", title: "", description: "", imageUrl: "", active: true, order: 0 };

export default function AdminTimelinePage() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [draft, setDraft] = useState<Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>>(blank);
  const [deleting, setDeleting] = useState<TimelineEvent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTimeline();
  }, []);

  async function fetchTimeline() {
    try {
      const res = await fetch("/api/coffee-history");
      if (res.ok) {
        const data = await res.json();
        setTimeline(data);
      }
    } catch (error) {
      console.error("Error fetching timeline events:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { setDraft({ ...blank }); setEditing({ ...blank, id: "new", createdAt: "", updatedAt: "" }); }
  function openEdit(t: TimelineEvent) { setDraft({ year: t.year, title: t.title, description: t.description, imageUrl: t.imageUrl, active: t.active, order: t.order }); setEditing(t); }
  function closeModal() { setEditing(null); }
  function del(t: TimelineEvent) { setDeleting(t); }

  const filteredTimeline = timeline.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.year.toLowerCase().includes(search.toLowerCase())
  );

  async function save() {
    setSaving(true);
    try {
      const method = editing!.id === "new" ? "POST" : "PUT";
      const body = editing!.id === "new" ? { ...draft, imageUrl: draft.imageUrl } : { ...draft, id: editing!.id, imageUrl: draft.imageUrl };
      
      const res = await fetch("/api/coffee-history", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchTimeline();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving timeline event:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting) {
      setDeletingId(deleting.id);
      // Optimistic update - remove from UI immediately
      setTimeline(prev => prev.filter(t => t.id !== deleting.id));
      
      try {
        const res = await fetch(`/api/coffee-history?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          // Revert if failed
          await fetchTimeline();
        }
      } catch (error) {
        console.error("Error deleting timeline event:", error);
        // Revert on error
        await fetchTimeline();
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Coffee History Timeline</h1>
        <p className="text-muted text-sm">Manage the interactive coffee history timeline events.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search timeline events by title, year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <AdminTable
        title={`Timeline Events (${filteredTimeline.length})`}
        items={filteredTimeline}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={del}
        columns={[
          { label: "Year", render: (t) => <span className="font-bold text-blue">{t.year}</span> },
          { label: "Title", render: (t) => <span className="font-medium">{t.title}</span> },
          { label: "Description", render: (t) => <span className="text-xs text-muted line-clamp-2">{t.description}</span> },
        ]}
      />

      {editing && (
        <AdminModal title={editing.id === "new" ? "Add Timeline Event" : "Edit Timeline Event"} onClose={closeModal} onSave={save}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Year" required><Input value={draft.year} onChange={(e) => setDraft(d => ({ ...d, year: e.target.value }))} placeholder="1901" /></Field>
            <Field label="Title" required><Input value={draft.title} onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} /></Field>
          </div>
          <Field label="Description">
            <Textarea value={draft.description} onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))} rows={4} />
          </Field>
          <Field label="Image">
            <ImageUpload value={draft.imageUrl} onChange={(url) => setDraft(d => ({ ...d, imageUrl: url }))} aspectRatio="banner" />
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Timeline Event"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.title}</span>?</>}
          confirmLabel="Delete Event"
          isLoading={deletingId === deleting.id}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
