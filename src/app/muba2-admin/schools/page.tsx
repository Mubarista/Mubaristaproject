"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Star, Search } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";

interface School {
  id: string;
  name: string;
  location: string;
  certifications: string;
  programs: string;
  rating: number;
  reviews: number;
  contact: string;
  website: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const blank: Omit<School, 'id' | 'createdAt' | 'updatedAt'> = { name: "", location: "", certifications: "", programs: "", rating: 4.5, reviews: 0, contact: "", website: "", active: true, order: 0 };

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<School | null>(null);
  const [draft, setDraft] = useState<Omit<School, 'id' | 'createdAt' | 'updatedAt'>>(blank);
  const [deleting, setDeleting] = useState<School | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      const res = await fetch("/api/schools?includeInactive=true");
      if (res.ok) {
        const data = await res.json();
        setSchools(data);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { setDraft({ ...blank }); setEditing({ ...blank, id: "new", createdAt: "", updatedAt: "" }); }
  function openEdit(s: School) { setDraft({ name: s.name, location: s.location, certifications: s.certifications, programs: s.programs, rating: s.rating, reviews: s.reviews, contact: s.contact, website: s.website, active: s.active, order: s.order }); setEditing(s); }
  function closeModal() { setEditing(null); }
  function del(s: School) { setDeleting(s); }

  async function save() {
    setSaving(true);
    try {
      const method = editing!.id === "new" ? "POST" : "PUT";
      const body = editing!.id === "new" ? draft : { ...draft, id: editing!.id };
      
      const res = await fetch("/api/schools", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchSchools();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving school:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/schools?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchSchools();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting school:", error);
      }
    }
  }

  const set = (k: keyof Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [k]: k === "rating" || k === "reviews" ? Number(e.target.value) : e.target.value }));

  const filteredSchools = schools.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.location.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-2xl font-bold">Schools</h1>
        <p className="text-muted text-sm">Manage barista schools and training academies.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search schools by name, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <AdminTable
        title={`Schools (${filteredSchools.length})`}
        items={filteredSchools}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={del}
        columns={[
          { label: "Name", render: (s) => <div><p className="font-medium">{s.name}</p><p className="text-xs text-muted">{s.location}</p></div> },
          { label: "Rating", render: (s) => <span className="flex items-center gap-1 text-yellow text-xs"><Star className="h-3 w-3 fill-current" />{s.rating} ({s.reviews})</span> },
          { label: "Certifications", render: (s) => <span className="text-xs text-muted">{s.certifications}</span> },
          { label: "Contact", render: (s) => <span className="text-xs text-blue">{s.contact}</span> },
        ]}
      />

      {editing && (
        <AdminModal title={editing.id === "new" ? "Add School" : "Edit School"} onClose={closeModal} onSave={save}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="School Name" required><Input value={draft.name} onChange={set("name")} /></Field>
            <Field label="Location"><Input value={draft.location} onChange={set("location")} placeholder="London, UK" /></Field>
          </div>
          <Field label="Certifications (comma separated)">
            <Input value={draft.certifications} onChange={set("certifications")} />
          </Field>
          <Field label="Programs (comma separated)">
            <Input value={draft.programs} onChange={set("programs")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rating"><Input type="number" step="0.1" min="0" max="5" value={draft.rating} onChange={set("rating")} /></Field>
            <Field label="Reviews"><Input type="number" value={draft.reviews} onChange={set("reviews")} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Email"><Input value={draft.contact} onChange={set("contact")} /></Field>
            <Field label="Website"><Input value={draft.website} onChange={set("website")} placeholder="school.com" /></Field>
          </div>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete School"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.name}</span>?</>}
          confirmLabel="Delete School"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
