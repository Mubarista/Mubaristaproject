"use client";

import { useState, useEffect } from "react";
import { Heart, Search } from "lucide-react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, ImageUpload } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { LoadingDots } from "@/components/ui/loading-dots";

const blank = { id: "", title: "", artist: "", image: "", likes: 0 };

export default function AdminLatteArtPage() {
  const [latteArt, setLatteArt] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>(blank);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLatteArt();
  }, []);

  async function fetchLatteArt() {
    try {
      const res = await fetch("/api/latte-art");
      const data = await res.json();
      setLatteArt(data);
    } catch (error) {
      console.error("Error fetching latte art:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { const d = { ...blank, id: "new" }; setDraft(d); setEditing(d); }
  function openEdit(a: any) { setDraft({ ...a }); setEditing(a); }
  function closeModal() { setEditing(null); }

  async function save() {
    setSaving(true);
    try {
      const exists = latteArt.find((a) => a.id === draft.id);
      const method = exists ? "PUT" : "POST";
      const res = await fetch("/api/latte-art", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await fetchLatteArt();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving latte art:", error);
    } finally {
      setSaving(false);
    }
  }

  function del(a: any) {
    setDeleting(a);
  }

  const filteredLatteArt = latteArt.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/latte-art?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchLatteArt();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting latte art:", error);
      }
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d: any) => ({ ...d, [k]: k === "likes" ? Number(e.target.value) : e.target.value }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Featured Latte Art</h1>
        <p className="text-muted text-sm">Manage the featured art gallery shown on the homepage.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search latte art by title..."
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
          title={`Latte Art (${filteredLatteArt.length})`}
          items={filteredLatteArt}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={del}
          columns={[
            { label: "Title", render: (a) => <span className="font-medium">{a.title}</span> },
            { label: "Artist", render: (a) => a.artist },
            {
              label: "Likes",
              render: (a) => (
                <span className="flex items-center gap-1 text-red">
                  <Heart className="h-3 w-3 fill-current" /> {a.likes.toLocaleString()}
                </span>
              ),
            },
            { label: "Image", render: (a) => <span className="text-xs text-muted truncate max-w-[180px] block">{a.image}</span> },
          ]}
        />
      )}

      {editing && (
        <AdminModal
          title={latteArt.find((a: any) => a.id === draft.id) ? "Edit Latte Art" : "Add Latte Art"}
          onClose={closeModal}
          onSave={save}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" required><Input value={draft.title} onChange={set("title")} /></Field>
            <Field label="Artist Barista"><Input value={draft.artist} onChange={set("artist")} /></Field>
          </div>
          <Field label="Image">
            <ImageUpload value={draft.image} onChange={(url) => setDraft((d: any) => ({ ...d, image: url }))} aspectRatio="square" allowCrop />
          </Field>
          <Field label="Likes"><Input type="number" value={draft.likes} onChange={set("likes")} /></Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Latte Art"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.title}</span>?</>}
          confirmLabel="Delete Art"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
