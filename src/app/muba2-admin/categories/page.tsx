"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Select } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Category {
  id: string;
  name: string;
  active: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

const blank: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = { name: "", active: true, orderIndex: 0 };

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState("tools");
  const [toolCategories, setToolCategories] = useState<Category[]>([]);
  const [bookCategories, setBookCategories] = useState<Category[]>([]);
  const [articleCategories, setArticleCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [draft, setDraft] = useState<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>(blank);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const [toolsRes, booksRes, articlesRes] = await Promise.all([
        fetch("/api/tool-categories"),
        fetch("/api/book-categories"),
        fetch("/api/article-categories"),
      ]);

      if (toolsRes.ok) setToolCategories(await toolsRes.json());
      if (booksRes.ok) setBookCategories(await booksRes.json());
      if (articlesRes.ok) setArticleCategories(await articlesRes.json());
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }

  function getCategories() {
    switch (activeTab) {
      case "tools": return toolCategories;
      case "books": return bookCategories;
      case "articles": return articleCategories;
      default: return [];
    }
  }

  function getApiEndpoint() {
    switch (activeTab) {
      case "tools": return "/api/tool-categories";
      case "books": return "/api/book-categories";
      case "articles": return "/api/article-categories";
      default: return "";
    }
  }

  function openAdd() {
    setDraft({ ...blank });
    setEditing({ ...blank, id: "new", createdAt: "", updatedAt: "" });
  }

  function openEdit(c: Category) {
    setDraft({ name: c.name, active: c.active, orderIndex: c.orderIndex });
    setEditing(c);
  }

  function closeModal() {
    setEditing(null);
  }

  function del(c: Category) {
    setDeleting(c);
  }

  async function save() {
    setSaving(true);
    try {
      const method = editing!.id === "new" ? "POST" : "PUT";
      const url = editing!.id === "new" ? getApiEndpoint() : `${getApiEndpoint()}/${editing!.id}`;
      
      // Only send the fields that are actually defined (using camelCase)
      const body = editing!.id === "new" 
        ? { 
            name: draft.name, 
            active: draft.active, 
            orderIndex: draft.orderIndex 
          } 
        : { 
            name: draft.name, 
            active: draft.active, 
            orderIndex: draft.orderIndex 
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchCategories();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`${getApiEndpoint()}/${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchCategories();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  }

  const set = (k: keyof Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((d) => ({
      ...d,
      [k]: k === "active" ? e.target.value === "true" : k === "orderIndex" ? Number(e.target.value) : e.target.value,
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
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-muted text-sm">Manage categories for tools, books, and articles.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tools">Tool Categories</TabsTrigger>
          <TabsTrigger value="books">Book Categories</TabsTrigger>
          <TabsTrigger value="articles">Article Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <AdminTable
            title={`Tool Categories (${toolCategories.length})`}
            items={toolCategories}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={del}
            columns={[
              { label: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
              { label: "Status", render: (c) => <Badge variant={c.active ? "green" : "default"}>{c.active ? "Active" : "Inactive"}</Badge> },
              { label: "Order", render: (c) => <span className="text-xs text-muted">{c.orderIndex}</span> },
            ]}
          />
        </TabsContent>

        <TabsContent value="books">
          <AdminTable
            title={`Book Categories (${bookCategories.length})`}
            items={bookCategories}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={del}
            columns={[
              { label: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
              { label: "Status", render: (c) => <Badge variant={c.active ? "green" : "default"}>{c.active ? "Active" : "Inactive"}</Badge> },
              { label: "Order", render: (c) => <span className="text-xs text-muted">{c.orderIndex}</span> },
            ]}
          />
        </TabsContent>

        <TabsContent value="articles">
          <AdminTable
            title={`Article Categories (${articleCategories.length})`}
            items={articleCategories}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={del}
            columns={[
              { label: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
              { label: "Status", render: (c) => <Badge variant={c.active ? "green" : "default"}>{c.active ? "Active" : "Inactive"}</Badge> },
              { label: "Order", render: (c) => <span className="text-xs text-muted">{c.orderIndex}</span> },
            ]}
          />
        </TabsContent>
      </Tabs>

      {editing && (
        <AdminModal
          title={editing.id === "new" ? `Add ${activeTab.slice(0, -1)} Category` : `Edit ${activeTab.slice(0, -1)} Category`}
          onClose={closeModal}
          onSave={save}
        >
          <Field label="Name" required>
            <Input value={draft.name} onChange={set("name")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <Select
                value={String(draft.active)}
                onChange={(e) => {
                  const value = e.target.value;
                  setDraft((d) => ({ ...d, active: value === "true" }));
                }}
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
              />
            </Field>
            <Field label="Order">
              <Input type="number" value={draft.orderIndex} onChange={set("orderIndex")} />
            </Field>
          </div>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Category"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.name}</span>?</>}
          confirmLabel="Delete Category"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
