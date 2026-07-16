"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, Select, ImageUpload } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Star, Search } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Tool {
  id: string;
  name: string;
  category: string;
  categoryId: string | null;
  price: number;
  rating: number;
  image: string;
  description: string;
  brand: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
  orderIndex: number;
}

const blank: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'> = { name: "", category: "", categoryId: null, price: 0, rating: 4.5, image: "", description: "", brand: "", active: true, order: 0 };

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [draft, setDraft] = useState<Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>>(blank);
  const [deleting, setDeleting] = useState<Tool | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTools();
    fetchCategories();
  }, []);

  async function fetchTools() {
    try {
      const res = await fetch("/api/tools");
      if (res.ok) {
        const data = await res.json();
        setTools(data);
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/tool-categories?active=true");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !draft.category) {
          setDraft(d => ({ ...d, category: data[0].name }));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.brand.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setDraft({ ...blank }); setEditing({ ...blank, id: "new", createdAt: "", updatedAt: "" }); }
  function openEdit(t: Tool) { setDraft({ name: t.name, category: t.category, categoryId: t.categoryId, price: t.price, rating: t.rating, image: t.image, description: t.description, brand: t.brand, active: t.active, order: t.order }); setEditing(t); }
  function closeModal() { setEditing(null); }
  function del(t: Tool) { setDeleting(t); }

  async function save() {
    setSaving(true);
    try {
      const method = editing!.id === "new" ? "POST" : "PUT";
      const body = editing!.id === "new" ? draft : { ...draft, id: editing!.id };

      const res = await fetch("/api/tools", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchTools();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving tool:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/tools?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchTools();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting tool:", error);
      }
    }
  }

  const set = (k: keyof Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: k === "price" || k === "rating" ? Number(e.target.value) : e.target.value }));

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
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-foreground/50 text-sm">Manage the barista tools marketplace.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search tools by name, brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <AdminTable
        title={`Tools (${filteredTools.length})`}
        items={filteredTools}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={del}
        columns={[
          { label: "Name", render: (t) => <div><p className="font-medium">{t.name}</p><p className="text-xs text-foreground/50">{t.brand}</p></div> },
          { label: "Category", render: (t) => <span className="text-xs text-blue">{t.category}</span> },
          { label: "Price", render: (t) => <span className="text-green font-semibold">RWF {t.price.toLocaleString()}</span> },
          { label: "Rating", render: (t) => <span className="flex items-center gap-1 text-yellow text-xs"><Star className="h-3 w-3 fill-current" />{t.rating}</span> },
        ]}
      />

      {editing && (
        <AdminModal title={editing.id === "new" ? "Add Tool" : "Edit Tool"} onClose={closeModal} onSave={save}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required><Input value={draft.name} onChange={set("name")} /></Field>
            <Field label="Brand"><Input value={draft.brand} onChange={set("brand")} /></Field>
          </div>
          <Field label="Description"><Textarea value={draft.description} onChange={set("description")} rows={2} /></Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Category">
              <Select
                value={draft.categoryId || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const category = categories.find(c => c.id === value);
                  setDraft(d => ({
                    ...d,
                    categoryId: value,
                    category: category?.name || ""
                  }));
                }}
                options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
              />
            </Field>
            <Field label="Price (RWF)"><Input type="number" value={draft.price} onChange={set("price")} /></Field>
            <Field label="Rating"><Input type="number" step="0.1" min="0" max="5" value={draft.rating} onChange={set("rating")} /></Field>
          </div>
          <Field label="Image">
            <ImageUpload value={draft.image} onChange={(url) => setDraft(d => ({ ...d, image: url }))} aspectRatio="square" />
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Tool"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.name}</span>?</>}
          confirmLabel="Delete Tool"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}