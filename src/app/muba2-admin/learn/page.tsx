"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, GripVertical } from "lucide-react";
import { supabaseAdminAuth } from "@/lib/supabase";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, Select, ImageUpload, VideoUpload } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface LearnCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  free: boolean;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ImageWithCaption {
  url: string;
  caption: string;
}

interface LearningContent {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  contentType: string;
  mediaUrl: string | null;
  textContent: string | null;
  images: ImageWithCaption[];
  isPremium: boolean;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  category?: LearnCategory;
}

const blankCategory: Omit<LearnCategory, 'id' | 'createdAt' | 'updatedAt'> = { title: "", description: "", icon: "📚", free: true, active: true, order: 0 };

const blankContent: Omit<LearningContent, 'id' | 'createdAt' | 'updatedAt' | 'category'> = {
  categoryId: "",
  title: "",
  description: "",
  contentType: "text",
  mediaUrl: null,
  textContent: null,
  images: [],
  isPremium: false,
  order: 0,
  active: true,
};

const MAX_IMAGES = 10;

export default function AdminLearnPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [learnCategories, setLearnCategories] = useState<LearnCategory[]>([]);
  const [content, setContent] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<LearnCategory | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<Omit<LearnCategory, 'id' | 'createdAt' | 'updatedAt'>>(blankCategory);
  const [deletingCategory, setDeletingCategory] = useState<LearnCategory | null>(null);
  const [editingContent, setEditingContent] = useState<LearningContent | null>(null);
  const [contentDraft, setContentDraft] = useState<Omit<LearningContent, 'id' | 'createdAt' | 'updatedAt' | 'category'>>(blankContent);
  const [deletingContent, setDeletingContent] = useState<LearningContent | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [contentSearch, setContentSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [filterCategory]);

  async function fetchData() {
    setLoading(true);
    try {
      const [catRes, contentRes] = await Promise.all([
        fetch("/api/learn-categories"),
        fetch(filterCategory ? `/api/learning-content?categoryId=${filterCategory}` : "/api/learning-content"),
      ]);
      if (catRes.ok) {
        const catData = await catRes.json();
        setLearnCategories(catData);
      }
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setContent(contentData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAddCategory() { 
    setCategoryDraft({ ...blankCategory }); 
    setEditingCategory({ ...blankCategory, id: "new", createdAt: "", updatedAt: "" }); 
  }
  
  function openEditCategory(c: LearnCategory) { 
    setCategoryDraft({ title: c.title, description: c.description, icon: c.icon, free: c.free, active: c.active, order: c.order }); 
    setEditingCategory(c); 
  }
  
  function closeCategoryModal() { setEditingCategory(null); }
  function delCategory(c: LearnCategory) { setDeletingCategory(c); }

  async function saveCategory() {
    setSaving(true);
    try {
      const method = editingCategory!.id === "new" ? "POST" : "PUT";
      const body = editingCategory!.id === "new" ? categoryDraft : { ...categoryDraft, id: editingCategory!.id };
      
      const res = await fetch("/api/learn-categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchData();
        closeCategoryModal();
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteCategory() {
    if (deletingCategory) {
      try {
        const res = await fetch(`/api/learn-categories?id=${deletingCategory.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchData();
          setDeletingCategory(null);
        }
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  }

  function openAddContent() { 
    setContentDraft({ ...blankContent, categoryId: filterCategory || (learnCategories[0]?.id || "") }); 
    setEditingContent({ ...blankContent, id: "new", createdAt: "", updatedAt: "" }); 
  }
  
  function openEditContent(c: LearningContent) { 
    setContentDraft({ 
      categoryId: c.categoryId, 
      title: c.title, 
      description: c.description, 
      contentType: c.contentType, 
      mediaUrl: c.mediaUrl, 
      textContent: c.textContent, 
      images: c.images || [],
      isPremium: c.isPremium, 
      order: c.order, 
      active: c.active 
    }); 
    setEditingContent(c); 
  }

  function addImageSlot() {
    if (contentDraft.images.length >= MAX_IMAGES) return;
    setContentDraft(d => ({ ...d, images: [...d.images, { url: "", caption: "" }] }));
  }

  function updateImageSlot(index: number, field: "url" | "caption", value: string) {
    setContentDraft(d => ({
      ...d,
      images: d.images.map((img, i) => i === index ? { ...img, [field]: value } : img),
    }));
  }

  function removeImageSlot(index: number) {
    setContentDraft(d => ({
      ...d,
      images: d.images.filter((_, i) => i !== index),
    }));
  }
  
  function closeContentModal() { setEditingContent(null); }
  function delContent(c: LearningContent) { setDeletingContent(c); }

  async function adminToken() {
    const { data } = await supabaseAdminAuth.auth.getSession();
    return data.session?.access_token || "";
  }

  async function saveContent() {
    setSaving(true);
    try {
      const method = editingContent!.id === "new" ? "POST" : "PUT";
      const body = editingContent!.id === "new" ? contentDraft : { ...contentDraft, id: editingContent!.id };
      const token = await adminToken();

      const res = await fetch("/api/learning-content", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchData();
        closeContentModal();
      } else {
        const data = await res.json().catch(() => ({ error: "Failed to save content" }));
        alert(data.error || "Failed to save content");
      }
    } catch (error) {
      console.error("Error saving content:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteContent() {
    if (deletingContent) {
      try {
        const token = await adminToken();
        const res = await fetch(`/api/learning-content?id=${deletingContent.id}`, {
          method: "DELETE",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.ok) {
          await fetchData();
          setDeletingContent(null);
        }
      } catch (error) {
        console.error("Error deleting content:", error);
      }
    }
  }

  const filteredCategories = learnCategories.filter(c =>
    c.title.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredContent = content.filter(c =>
    c.title.toLowerCase().includes(contentSearch.toLowerCase())
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
        <h1 className="text-2xl font-bold">Learning Center</h1>
        <p className="text-muted text-sm">Manage learning categories and content materials.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
              <input
                type="text"
                placeholder="Search categories by title..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              />
            </div>
          </div>

          <AdminTable
            title={`Categories (${filteredCategories.length})`}
            items={filteredCategories}
            onAdd={openAddCategory}
            onEdit={openEditCategory}
            onDelete={delCategory}
            columns={[
              { label: "Icon", render: (c) => <span className="text-2xl">{c.icon}</span> },
              { label: "Title", render: (c) => <span className="font-medium">{c.title}</span> },
              { label: "Description", render: (c) => <span className="text-xs text-muted">{c.description}</span> },
              { label: "Access", render: (c) => <Badge variant={c.free ? "green" : "yellow"}>{c.free ? "Free" : "Premium"}</Badge> },
            ]}
          />
        </TabsContent>

        <TabsContent value="content">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
              <input
                type="text"
                placeholder="Search content by title..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              />
            </div>
          </div>

          <div className="mb-4">
            <Field label="Filter by Category">
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                options={[{ value: "", label: "All Categories" }, ...learnCategories.map(c => ({ value: c.id, label: c.title }))]}
              />
            </Field>
          </div>
          <AdminTable
            title={`Content (${filteredContent.length})`}
            items={filteredContent}
            onAdd={openAddContent}
            onEdit={openEditContent}
            onDelete={delContent}
            columns={[
              { label: "Title", render: (c) => <span className="font-medium">{c.title}</span> },
              { label: "Category", render: (c) => <span className="text-sm text-muted">{c.category?.title || "—"}</span> },
              { label: "Type", render: (c) => <Badge variant="blue">{c.contentType}</Badge> },
              { label: "Access", render: (c) => <Badge variant={c.isPremium ? "yellow" : "green"}>{c.isPremium ? "Premium" : "Free"}</Badge> },
              { label: "Status", render: (c) => <Badge variant={c.active ? "green" : "default"}>{c.active ? "Active" : "Inactive"}</Badge> },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Category Modal */}
      {editingCategory && (
        <AdminModal title={editingCategory.id === "new" ? "Add Category" : "Edit Category"} onClose={closeCategoryModal} onSave={saveCategory}>
          <Field label="Title" required><Input value={categoryDraft.title} onChange={(e) => setCategoryDraft(d => ({ ...d, title: e.target.value }))} /></Field>
          <Field label="Description"><Textarea value={categoryDraft.description} onChange={(e) => setCategoryDraft(d => ({ ...d, description: e.target.value }))} rows={2} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Emoji Icon"><Input value={categoryDraft.icon} onChange={(e) => setCategoryDraft(d => ({ ...d, icon: e.target.value }))} /></Field>
            <Field label="Access Level">
              <Select
                value={categoryDraft.free ? "free" : "premium"}
                onChange={(e) => setCategoryDraft(d => ({ ...d, free: e.target.value === "free" }))}
                options={[{ value: "free", label: "Free" }, { value: "premium", label: "Premium" }]}
              />
            </Field>
          </div>
        </AdminModal>
      )}

      {/* Content Modal */}
      {editingContent && (
        <AdminModal title={editingContent.id === "new" ? "Add Content" : "Edit Content"} onClose={closeContentModal} onSave={saveContent}>
          <Field label="Category" required>
            <Select
              value={contentDraft.categoryId}
              onChange={(e) => setContentDraft(d => ({ ...d, categoryId: e.target.value }))}
              options={learnCategories.map(c => ({ value: c.id, label: c.title }))}
            />
          </Field>
          <Field label="Title" required>
            <Input value={contentDraft.title} onChange={(e) => setContentDraft(d => ({ ...d, title: e.target.value }))} />
          </Field>
          <Field label="Description">
            <Textarea value={contentDraft.description} onChange={(e) => setContentDraft(d => ({ ...d, description: e.target.value }))} rows={2} />
          </Field>
          <Field label="Content Type" required>
            <Select
              value={contentDraft.contentType}
              onChange={(e) => setContentDraft(d => ({ ...d, contentType: e.target.value }))}
              options={[
                { value: "text", label: "Text" },
                { value: "video", label: "Video" },
                { value: "image", label: "Image" },
              ]}
            />
          </Field>
          {contentDraft.contentType === "video" && (
            <Field label="Upload Video">
              <VideoUpload
                value={contentDraft.mediaUrl || ""}
                onChange={(url) => setContentDraft(d => ({ ...d, mediaUrl: url }))}
                label="learning video"
              />
            </Field>
          )}
          {contentDraft.contentType === "image" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm text-muted">
                  Images ({contentDraft.images.length}/{MAX_IMAGES})
                </label>
                <button
                  type="button"
                  onClick={addImageSlot}
                  disabled={contentDraft.images.length >= MAX_IMAGES}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue/10 text-blue text-xs font-medium hover:bg-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Image
                </button>
              </div>
              {contentDraft.images.length === 0 && (
                <div className="text-center py-6 rounded-xl border-2 border-dashed border-white/15 bg-muted-bg">
                  <p className="text-sm text-muted">No images added yet</p>
                  <p className="text-xs text-muted/60 mt-1">Click "Add Image" to upload up to {MAX_IMAGES} images with captions</p>
                </div>
              )}
              {contentDraft.images.map((img, index) => (
                <div key={index} className="p-4 rounded-xl border border-white/10 bg-muted-bg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted flex items-center gap-1.5">
                      <GripVertical className="h-3.5 w-3.5" />
                      Image {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImageSlot(index)}
                      className="p-1.5 rounded-lg hover:bg-red/20 text-red transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ImageUpload
                    value={img.url}
                    onChange={(url) => updateImageSlot(index, "url", url)}
                    aspectRatio="square"
                    allowCrop={true}
                    label={`Image ${index + 1}`}
                  />
                  <Field label="Caption">
                    <Input
                      value={img.caption}
                      onChange={(e) => updateImageSlot(index, "caption", e.target.value)}
                      placeholder={`Caption for image ${index + 1}`}
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}
          {contentDraft.contentType === "text" && (
            <Field label="Text Content">
              <Textarea 
                value={contentDraft.textContent || ""} 
                onChange={(e) => setContentDraft(d => ({ ...d, textContent: e.target.value }))}
                rows={6}
                placeholder="Enter the learning content here..."
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Access Level">
              <Select
                value={contentDraft.isPremium ? "premium" : "free"}
                onChange={(e) => setContentDraft(d => ({ ...d, isPremium: e.target.value === "premium" }))}
                options={[{ value: "free", label: "Free" }, { value: "premium", label: "Premium" }]}
              />
            </Field>
            <Field label="Status">
              <Select
                value={contentDraft.active ? "active" : "inactive"}
                onChange={(e) => setContentDraft(d => ({ ...d, active: e.target.value === "active" }))}
                options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
              />
            </Field>
          </div>
          <Field label="Order">
            <Input 
              type="number"
              value={contentDraft.order} 
              onChange={(e) => setContentDraft(d => ({ ...d, order: parseInt(e.target.value) || 0 }))}
            />
          </Field>
        </AdminModal>
      )}

      {/* Category Delete Dialog */}
      {deletingCategory && (
        <ConfirmDialog
          title="Delete Category"
          message={<>Are you sure you want to delete <span className="font-semibold">{deletingCategory.title}</span>? This will also delete all content in this category.</>}
          confirmLabel="Delete Category"
          onConfirm={confirmDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
        />
      )}

      {/* Content Delete Dialog */}
      {deletingContent && (
        <ConfirmDialog
          title="Delete Content"
          message={<>Are you sure you want to delete <span className="font-semibold">{deletingContent.title}</span>?</>}
          confirmLabel="Delete Content"
          onConfirm={confirmDeleteContent}
          onCancel={() => setDeletingContent(null)}
        />
      )}
    </div>
  );
}
