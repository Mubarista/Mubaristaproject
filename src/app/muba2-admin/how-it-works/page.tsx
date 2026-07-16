"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAdminData } from "@/lib/admin-data-context";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, Select } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { LoadingDots } from "@/components/ui/loading-dots";

interface HowItWorksStep {
  id: string;
  number: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  bg: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const iconOptions = [
  { value: "UserPlus", label: "UserPlus" },
  { value: "Search", label: "Search" },
  { value: "Upload", label: "Upload" },
  { value: "Trophy", label: "Trophy" },
  { value: "Crown", label: "Crown" },
  { value: "Star", label: "Star" },
  { value: "BookOpen", label: "BookOpen" },
  { value: "Coffee", label: "Coffee" },
  { value: "Heart", label: "Heart" },
  { value: "Globe", label: "Globe" },
  { value: "Award", label: "Award" },
  { value: "Zap", label: "Zap" },
];

const colorOptions = [
  { value: "text-blue", label: "Blue" },
  { value: "text-green", label: "Green" },
  { value: "text-yellow", label: "Yellow" },
  { value: "text-red", label: "Red" },
  { value: "text-purple", label: "Purple" },
  { value: "text-orange", label: "Orange" },
  { value: "text-pink", label: "Pink" },
  { value: "text-cyan", label: "Cyan" },
];

const bgOptions = [
  { value: "bg-blue/10 border-blue/20", label: "Blue" },
  { value: "bg-green/10 border-green/20", label: "Green" },
  { value: "bg-yellow/10 border-yellow/20", label: "Yellow" },
  { value: "bg-red/10 border-red/20", label: "Red" },
  { value: "bg-purple/10 border-purple/20", label: "Purple" },
  { value: "bg-orange/10 border-orange/20", label: "Orange" },
  { value: "bg-pink/10 border-pink/20", label: "Pink" },
  { value: "bg-cyan/10 border-cyan/20", label: "Cyan" },
];

const blank: HowItWorksStep = {
  id: "new",
  number: "",
  title: "",
  description: "",
  iconName: "UserPlus",
  color: "text-blue",
  bg: "bg-blue/10 border-blue/20",
  sortOrder: 0,
  isActive: true,
};

export default function AdminHowItWorksPage() {
  useAdminData();

  const [steps, setSteps] = useState<HowItWorksStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HowItWorksStep | null>(null);
  const [draft, setDraft] = useState<HowItWorksStep>(blank);
  const [deleting, setDeleting] = useState<HowItWorksStep | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSteps();
  }, []);

  async function fetchSteps() {
    try {
      const res = await fetch("/api/how-it-works");
      if (res.ok) {
        const data = await res.json();
        setSteps(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching how it works steps:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setDraft({ ...blank });
    setEditing({ ...blank });
  }

  function openEdit(step: HowItWorksStep) {
    setDraft({ ...step });
    setEditing(step);
  }

  function closeModal() {
    setEditing(null);
  }

  async function save() {
    const body = { ...draft };
    if (editing?.id === "new") {
      body.id = "";
    }
    try {
      const res = await fetch("/api/how-it-works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchSteps();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving step:", error);
    }
  }

  function del(step: HowItWorksStep) {
    setDeleting(step);
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/how-it-works?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchSteps();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting step:", error);
      }
    }
  }

  const filteredSteps = steps.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-2xl font-bold">How It Works</h1>
        <p className="text-muted text-sm">Manage the steps shown on the homepage.</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search steps by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <AdminTable
        title={`Steps (${filteredSteps.length})`}
        items={filteredSteps}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={del}
        columns={[
          { label: "#", render: (s) => <span className="font-medium">{s.number}</span> },
          { label: "Title", render: (s) => <span className="font-medium">{s.title}</span> },
          { label: "Description", render: (s) => <span className="text-muted text-xs line-clamp-2">{s.description}</span> },
          { label: "Icon", render: (s) => <span className="text-xs">{s.iconName}</span> },
          { label: "Color", render: (s) => <span className={`text-xs ${s.color}`}>{s.color}</span> },
          { label: "Order", render: (s) => <span className="text-xs">{s.sortOrder}</span> },
        ]}
      />

      {editing && (
        <AdminModal
          title={editing.id === "new" ? "Add Step" : "Edit Step"}
          onClose={closeModal}
          onSave={save}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Number" required>
              <Input
                value={draft.number}
                onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))}
                placeholder="01"
              />
            </Field>
            <Field label="Sort Order" required>
              <Input
                type="number"
                value={draft.sortOrder}
                onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))}
              />
            </Field>
          </div>
          <Field label="Title" required>
            <Input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </Field>
          <Field label="Description" required>
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={3}
            />
          </Field>
          <Field label="Icon" required>
            <Select
              options={iconOptions}
              value={draft.iconName}
              onChange={(e) => setDraft((d) => ({ ...d, iconName: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Color" required>
              <Select
                options={colorOptions}
                value={draft.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
              />
            </Field>
            <Field label="Background" required>
              <Select
                options={bgOptions}
                value={draft.bg}
                onChange={(e) => setDraft((d) => ({ ...d, bg: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Active">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-white/10 bg-muted-bg text-blue focus:ring-blue"
              />
              <span className="text-sm text-muted">Show this step on the homepage</span>
            </label>
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Step"
          message={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleting.title}</span>?
            </>
          }
          confirmLabel="Delete Step"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
