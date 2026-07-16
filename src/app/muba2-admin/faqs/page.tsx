"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { LoadingDots } from "@/components/ui/loading-dots";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const blank: Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'> = { question: "", answer: "", active: true, order: 0 };

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [draft, setDraft] = useState<Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'>>(blank);
  const [deleting, setDeleting] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchFAQs();
  }, []);

  async function fetchFAQs() {
    try {
      const res = await fetch("/api/faqs");
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { setDraft({ ...blank }); setEditing({ ...blank, id: "new", createdAt: "", updatedAt: "" }); }
  function openEdit(f: FAQ) { setDraft({ question: f.question, answer: f.answer, active: f.active, order: f.order }); setEditing(f); }
  function closeModal() { setEditing(null); }
  function del(f: FAQ) { setDeleting(f); }

  async function save() {
    setSaving(true);
    try {
      const method = editing!.id === "new" ? "POST" : "PUT";
      const body = editing!.id === "new" ? draft : { ...draft, id: editing!.id };
      
      const res = await fetch("/api/faqs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchFAQs();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving FAQ:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/faqs?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchFAQs();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting FAQ:", error);
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

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">FAQs</h1>
        <p className="text-muted text-sm">Manage frequently asked questions shown on the homepage.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search FAQs by question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <AdminTable
        title={`FAQs (${filteredFaqs.length})`}
        items={filteredFaqs}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={del}
        columns={[
          { label: "Question", render: (f) => <span className="font-medium">{f.question}</span> },
          { label: "Answer", render: (f) => <span className="text-muted text-xs line-clamp-2">{f.answer}</span> },
        ]}
      />

      {editing && (
        <AdminModal title={editing.id === "new" ? "Add FAQ" : "Edit FAQ"} onClose={closeModal} onSave={save}>
          <Field label="Question" required>
            <Input value={draft.question} onChange={(e) => setDraft(d => ({ ...d, question: e.target.value }))} />
          </Field>
          <Field label="Answer" required>
            <Textarea rows={4} value={draft.answer} onChange={(e) => setDraft(d => ({ ...d, answer: e.target.value }))} />
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete FAQ"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.question}</span>?</>}
          confirmLabel="Delete FAQ"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
