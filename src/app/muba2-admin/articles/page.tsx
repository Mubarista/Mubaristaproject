"use client";

import { useState, useEffect } from "react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, ImageUpload, DatePicker, Select } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
  active: boolean;
  orderIndex: number;
}

const blank = { id: "", title: "", excerpt: "", category: "", categoryId: null, publishedDate: "", coverImage: "", author: "" };

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>(blank);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  async function fetchArticles() {
    try {
      const res = await fetch("/api/articles");
      const data = await res.json();
      setArticles(data);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/article-categories?active=true");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !draft.category) {
          setDraft((d: any) => ({ ...d, category: data[0].name }));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.author.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { const d = { ...blank, id: String(Date.now()) }; setDraft(d); setEditing(d); }
  function openEdit(a: any) { setDraft({ ...a, publishedDate: a.publishedDate || "", coverImage: a.coverImage || "", categoryId: a.categoryId || null }); setEditing(a); }
  function closeModal() { setEditing(null); }

  async function save() {
    setSaving(true);
    try {
      const exists = articles.find((a) => a.id === draft.id);
      const method = exists ? "PUT" : "POST";
      const res = await fetch("/api/articles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await fetchArticles();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving article:", error);
    } finally {
      setSaving(false);
    }
  }

  function del(a: any) {
    setDeleting(a);
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/articles?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchArticles();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting article:", error);
      }
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d: any) => ({ ...d, [k]: e.target.value }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <p className="text-foreground/50 text-sm">Manage blog articles shown on the homepage and learning sections.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search articles by title, author, or category..."
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
          title={`Articles (${filteredArticles.length})`}
          items={filteredArticles}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={del}
          columns={[
            { label: "Title", render: (a) => <span className="font-medium">{a.title}</span> },
            { label: "Category", render: (a) => <span className="text-blue text-xs">{a.category}</span> },
            { label: "Author", render: (a) => a.author },
            { label: "Date", render: (a) => <span className="text-foreground/50 text-xs">{a.publishedDate}</span> },
          ]}
        />
      )}

      {editing && (
        <AdminModal
          title={articles.find((a: any) => a.id === draft.id) ? "Edit Article" : "Add Article"}
          onClose={closeModal}
          onSave={save}
        >
          <Field label="Title" required><Input value={draft.title} onChange={set("title")} /></Field>
          <Field label="Excerpt"><Textarea value={draft.excerpt} onChange={set("excerpt")} rows={2} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select
                value={draft.categoryId || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  const category = categories.find(c => c.id === value);
                  setDraft((d: any) => ({
                    ...d,
                    categoryId: value,
                    category: category?.name || ""
                  }));
                }}
                options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
              />
            </Field>
            <Field label="Author"><Input value={draft.author} onChange={set("author")} /></Field>
          </div>
          <Field label="Published Date">
            <DatePicker value={draft.publishedDate || ""} onChange={(date) => setDraft((d: any) => ({ ...d, publishedDate: date }))} />
          </Field>
          <Field label="Cover Image">
            <ImageUpload value={draft.coverImage || ""} onChange={(url) => setDraft((d: any) => ({ ...d, coverImage: url }))} aspectRatio="banner" />
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Article"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.title}</span>?</>}
          confirmLabel="Delete Article"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}