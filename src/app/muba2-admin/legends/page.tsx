"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import Image from "next/image";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, ImageUpload, CountrySelect } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Legend {
  id: string;
  name: string;
  country: string;
  image: string;
  biography: string;
  achievements: string;
  awards: string;
  legacy: string;
  active: boolean;
  order: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

const blank: Omit<Legend, 'id' | 'createdAt' | 'updatedAt'> = { name: "", country: "", image: "", biography: "", achievements: "", awards: "", legacy: "", active: true, order: 0, images: [] };

export default function AdminLegendsPage() {
  const [legends, setLegends] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Legend | null>(null);
  const [draft, setDraft] = useState<Omit<Legend, 'id' | 'createdAt' | 'updatedAt'>>(blank);
  const [deleting, setDeleting] = useState<Legend | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    fetchLegends();
  }, []);

  async function fetchLegends() {
    try {
      const res = await fetch("/api/legends");
      if (res.ok) {
        const data = await res.json();
        setLegends(data);
      }
    } catch (error) {
      console.error("Error fetching legends:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { setDraft({ ...blank }); setEditing({ ...blank, id: "new", createdAt: "", updatedAt: "" }); }
  function openEdit(l: Legend) { setDraft({ name: l.name, country: l.country, image: l.image, biography: l.biography, achievements: l.achievements, awards: l.awards, legacy: l.legacy, active: l.active, order: l.order, images: l.images || [] }); setEditing(l); }
  function closeModal() { setEditing(null); }
  function del(l: Legend) { setDeleting(l); }

  async function save() {
    setSaving(true);
    try {
      const method = editing!.id === "new" ? "POST" : "PUT";
      const body = editing!.id === "new" ? draft : { ...draft, id: editing!.id };
      
      const res = await fetch("/api/legends", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchLegends();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving legend:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/legends?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchLegends();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting legend:", error);
      }
    }
  }

  const set = (k: keyof Omit<Legend, 'id' | 'createdAt' | 'updatedAt'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  function updateImage(index: number, url: string) {
    setDraft((d) => {
      const next = [...d.images];
      if (!url) {
        next.splice(index, 1);
      } else {
        next[index] = url;
      }
      return { ...d, images: next };
    });
  }

  function removeImage(index: number) {
    setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== index) }));
  }

  function addImage() {
    setDraft((d) => ({ ...d, images: [...d.images, ""] }));
  }

  const filteredLegends = legends.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.country.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold">Legend Baristas</h1>
        <p className="text-muted text-sm">Manage iconic barista profiles in the Hall of Fame.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search legends by name, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <AdminTable
        title={`Legends (${filteredLegends.length})`}
        items={filteredLegends}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={del}
        columns={[
          {
            label: "Barista",
            render: (l) => (
              <div className="flex items-center gap-3">
                {l.image && (
                  <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
                    <Image src={l.image} alt={l.name} fill sizes="40px" className="object-cover" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-muted">{l.country}</p>
                </div>
              </div>
            ),
          },
          { label: "Awards", render: (l) => <span className="text-xs text-muted">{l.awards}</span> },
          { label: "Achievements", render: (l) => <span className="text-xs text-muted">{l.achievements}</span> },
        ]}
      />

      {editing && (
        <AdminModal title={editing.id === "new" ? "Add Legend" : "Edit Legend"} onClose={closeModal} onSave={save}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required><Input value={draft.name} onChange={set("name")} /></Field>
            <Field label="Country">
              <CountrySelect value={draft.country} onChange={(c) => setDraft(d => ({ ...d, country: c }))} />
            </Field>
          </div>
          <Field label="Biography"><Textarea value={draft.biography} onChange={set("biography")} rows={3} /></Field>
          <Field label="Legacy"><Textarea value={draft.legacy} onChange={set("legacy")} rows={2} /></Field>
          <Field label="Achievements (one per line)">
            <Textarea value={draft.achievements} onChange={set("achievements")} rows={3} />
          </Field>
          <Field label="Awards (comma separated)">
            <Input value={draft.awards} onChange={set("awards")} />
          </Field>
          <Field label="Profile Photo">
            <ImageUpload value={draft.image} onChange={(url) => setDraft(d => ({ ...d, image: url }))} aspectRatio="square" allowCrop />
          </Field>
          <div className="border-t border-white/10 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Legend Photos</label>
              <span className="text-xs text-muted">{draft.images.length}/5</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {draft.images.map((img, i) => (
                <div key={i} className="relative">
                  <ImageUpload
                    value={img}
                    onChange={(url) => updateImage(i, url)}
                    aspectRatio="story"
                    allowCrop
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red text-white flex items-center justify-center text-xs"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {draft.images.length < 5 && (
                <button
                  type="button"
                  onClick={addImage}
                  className="aspect-[9/16] rounded-xl border border-dashed border-white/20 flex items-center justify-center text-sm text-muted hover:border-blue hover:text-blue transition-colors"
                >
                  + Add Photo
                </button>
              )}
            </div>
          </div>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Legend"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.name}</span>?</>}
          confirmLabel="Delete Legend"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
