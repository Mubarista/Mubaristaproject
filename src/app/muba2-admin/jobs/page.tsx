"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, Select, CountrySelect } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Job {
  id: string;
  title: string;
  company: string;
  country: string;
  salary: string;
  experience: string;
  type: string;
  description: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const blank: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> = { title: "", company: "", country: "", salary: "", experience: "", type: "Full-time", description: "", active: true, order: 0 };

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Job | null>(null);
  const [draft, setDraft] = useState<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>>(blank);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { setDraft({ ...blank }); setEditing({ ...blank, id: "new", createdAt: "", updatedAt: "" }); }
  function openEdit(j: Job) { setDraft({ title: j.title, company: j.company, country: j.country, salary: j.salary, experience: j.experience, type: j.type, description: j.description, active: j.active, order: j.order }); setEditing(j); }
  function closeModal() { setEditing(null); }
  function del(j: Job) { setDeleting(j); }

  async function save() {
    setSaving(true);
    try {
      const method = editing!.id === "new" ? "POST" : "PUT";
      const body = editing!.id === "new" ? draft : { ...draft, id: editing!.id };
      
      const res = await fetch("/api/jobs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchJobs();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving job:", error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting) {
      try {
        const res = await fetch(`/api/jobs?id=${deleting.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchJobs();
          setDeleting(null);
        }
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    }
  }

  const set = (k: keyof Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.country.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-2xl font-bold">Jobs</h1>
        <p className="text-muted text-sm">Manage barista job listings.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search jobs by title, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <AdminTable
        title={`Jobs (${filteredJobs.length})`}
        items={filteredJobs}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={del}
        columns={[
          { label: "Job Title", render: (j) => <div><p className="font-medium">{j.title}</p><p className="text-xs text-muted">{j.company}</p></div> },
          { label: "Location", render: (j) => j.country },
          { label: "Salary", render: (j) => <span className="text-green text-sm">{j.salary}</span> },
          { label: "Type", render: (j) => <Badge variant="blue">{j.type}</Badge> },
          { label: "Experience", render: (j) => <span className="text-xs text-muted">{j.experience}</span> },
        ]}
      />

      {editing && (
        <AdminModal title={editing.id === "new" ? "Add Job" : "Edit Job"} onClose={closeModal} onSave={save}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Job Title" required><Input value={draft.title} onChange={set("title")} /></Field>
            <Field label="Company"><Input value={draft.company} onChange={set("company")} /></Field>
          </div>
          <Field label="Description"><Textarea value={draft.description} onChange={set("description")} rows={3} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Country">
              <CountrySelect value={draft.country} onChange={(c) => setDraft(d => ({ ...d, country: c }))} />
            </Field>
            <Field label="Salary"><Input value={draft.salary} onChange={set("salary")} placeholder="RWF 50,000,000 - RWF 65,000,000" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Experience Required"><Input value={draft.experience} onChange={set("experience")} placeholder="3+ years" /></Field>
            <Field label="Job Type">
              <Select value={draft.type} onChange={set("type")} options={[
                { value: "Full-time", label: "Full-time" },
                { value: "Part-time", label: "Part-time" },
                { value: "Contract", label: "Contract" },
                { value: "Remote", label: "Remote" },
              ]} />
            </Field>
          </div>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Job"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.title}</span>?</>}
          confirmLabel="Delete Job"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
