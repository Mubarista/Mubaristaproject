"use client";

import { useState, useEffect } from "react";
import { Star, Search } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, Select, ImageUpload } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const blank = { id: "", name: "", role: "", image: "", content: "", rating: 5 };

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>(blank);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTestimonials();
  }, []);

  async function fetchTestimonials() {
    try {
      const res = await fetch("/api/testimonials");
      const data = await res.json();
      setTestimonials(data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { const d = { ...blank, id: String(Date.now()) }; setDraft(d); setEditing(d); }
  function openEdit(t: any) { setDraft({ ...t }); setEditing(t); }
  function closeModal() { setEditing(null); }

  async function save() {
    setSaving(true);
    try {
      const exists = testimonials.find((t) => t.id === draft.id);
      const method = exists ? "PUT" : "POST";
      const res = await fetch("/api/testimonials", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await fetchTestimonials();
        closeModal();
      } else {
        const errorData = await res.json();
        console.error("Save failed:", errorData);
        alert("Failed to save: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving testimonial:", error);
      alert("Error saving testimonial: " + error);
    } finally {
      setSaving(false);
    }
  }

  function del(t: any) {
    setDeleting(t);
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/testimonials?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchTestimonials();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting testimonial:", error);
      }
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDraft((d: any) => ({ ...d, [k]: k === "rating" ? Number(e.target.value) : e.target.value }));

  const filteredTestimonials = testimonials.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <p className="text-muted text-sm">Manage what community members say about MUBARISTA.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search testimonials by name, role..."
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
          title={`Testimonials (${filteredTestimonials.length})`}
          items={filteredTestimonials}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={del}
          columns={[
            { label: "Name", render: (t) => <span className="font-medium">{t.name}</span> },
            { label: "Role", render: (t) => <span className="text-muted text-xs">{t.role}</span> },
            { label: "Rating", render: (t) => <span className="flex items-center gap-0.5 text-yellow">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</span> },
            { label: "Content", render: (t) => <span className="text-xs text-muted line-clamp-1 max-w-xs">"{t.content}"</span> },
          ]}
        />
      )}

      {editing && (
        <AdminModal
          title={testimonials.find((t: any) => t.id === draft.id) ? "Edit Testimonial" : "Add Testimonial"}
          onClose={closeModal}
          onSave={save}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required><Input value={draft.name} onChange={set("name")} /></Field>
            <Field label="Role / Title"><Input value={draft.role} onChange={set("role")} placeholder="Head Barista, Seoul" /></Field>
          </div>
          <Field label="Content"><Textarea value={draft.content} onChange={set("content")} rows={3} /></Field>
          <Field label="Image">
            <ImageUpload value={draft.image} onChange={(url) => setDraft((d: any) => ({ ...d, image: url }))} aspectRatio="square" />
          </Field>
          <Field label="Rating (1–5)">
            <Select value={String(draft.rating)} onChange={set("rating")} options={[
              { value: "1", label: "1 ★" }, { value: "2", label: "2 ★★" },
              { value: "3", label: "3 ★★★" }, { value: "4", label: "4 ★★★★" }, { value: "5", label: "5 ★★★★★" },
            ]} />
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Testimonial"
          message={<>Are you sure you want to delete the testimonial from <span className="font-semibold">{deleting.name}</span>?</>}
          confirmLabel="Delete Testimonial"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
