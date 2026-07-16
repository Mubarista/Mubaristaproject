"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, Select, ImageUpload, FileUpload } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Star, Search } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  categoryId: string | null;
  price: number;
  rating: number;
  reviews: number;
  cover: string;
  pdfUrl: string;
  description: string;
  isPremium: boolean;
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

const blank: Omit<Book, 'id' | 'createdAt' | 'updatedAt'> = { title: "", author: "", category: "", categoryId: null, price: 0, rating: 4.5, reviews: 0, cover: "", pdfUrl: "", description: "", isPremium: true, active: true, order: 0 };

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Book | null>(null);
  const [draft, setDraft] = useState<Omit<Book, 'id' | 'createdAt' | 'updatedAt'>>(blank);
  const [deleting, setDeleting] = useState<Book | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchBooks() {
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/book-categories?active=true");
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

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setDraft({ ...blank }); setEditing({ ...blank, id: "new", createdAt: "", updatedAt: "" }); }
  function openEdit(b: Book) { setDraft({ title: b.title, author: b.author, category: b.category, categoryId: b.categoryId, price: b.price, rating: b.rating, reviews: b.reviews, cover: b.cover, pdfUrl: b.pdfUrl, description: b.description, isPremium: b.isPremium, active: b.active, order: b.order }); setEditing(b); }
  function closeModal() { setEditing(null); }
  function del(b: Book) { setDeleting(b); }

  async function save() {
    try {
      const method = editing!.id === "new" ? "POST" : "PUT";
      const body = editing!.id === "new" ? draft : { ...draft, id: editing!.id };

      const res = await fetch("/api/books", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchBooks();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving book:", error);
    }
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/books?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchBooks();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting book:", error);
      }
    }
  }

  const set = (k: keyof Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDraft((d) => ({
      ...d,
      [k]: k === "price" || k === "rating" || k === "reviews" ? Number(e.target.value)
        : k === "isPremium" ? e.target.value === "true"
        : e.target.value,
    }));

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
        <h1 className="text-2xl font-bold">Books</h1>
        <p className="text-foreground/50 text-sm">Manage the barista books marketplace.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search books by title, author, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <AdminTable
        title={`Books (${filteredBooks.length})`}
        items={filteredBooks}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={del}
        columns={[
          { label: "Title", render: (b) => <div><p className="font-medium">{b.title}</p><p className="text-xs text-foreground/50">by {b.author}</p></div> },
          { label: "Category", render: (b) => <span className="text-xs text-blue">{b.category}</span> },
          { label: "Price", render: (b) => <span className="text-green font-semibold">RWF {b.price}</span> },
          { label: "Rating", render: (b) => <span className="flex items-center gap-1 text-yellow text-xs"><Star className="h-3 w-3 fill-current" />{b.rating}</span> },
          { label: "Access", render: (b) => <Badge variant={b.isPremium ? "yellow" : "green"}>{b.isPremium ? "Premium" : "Free"}</Badge> },
        ]}
      />

      {editing && (
        <AdminModal title={editing.id === "new" ? "Add Book" : "Edit Book"} onClose={closeModal} onSave={save}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" required><Input value={draft.title} onChange={set("title")} /></Field>
            <Field label="Author"><Input value={draft.author} onChange={set("author")} /></Field>
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
            <Field label="Access">
              <Select value={String(draft.isPremium)} onChange={set("isPremium")} options={[{ value: "true", label: "Premium" }, { value: "false", label: "Free" }]} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rating"><Input type="number" step="0.1" min="0" max="5" value={draft.rating} onChange={set("rating")} /></Field>
            <Field label="Reviews"><Input type="number" value={draft.reviews} onChange={set("reviews")} /></Field>
          </div>
          <Field label="Cover Image">
            <ImageUpload value={draft.cover} onChange={(url) => setDraft(d => ({ ...d, cover: url }))} aspectRatio="portrait" />
          </Field>
          <Field label="Book PDF">
            <FileUpload value={draft.pdfUrl} onChange={(url) => setDraft(d => ({ ...d, pdfUrl: url }))} />
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Book"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.title}</span>?</>}
          confirmLabel="Delete Book"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
