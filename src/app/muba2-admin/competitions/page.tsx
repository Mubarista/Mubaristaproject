"use client";

import { useState, useEffect } from "react";
import { Globe, Search } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAdminData } from "@/lib/admin-data-context";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, Textarea, Select, ImageUpload } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import type { Competition } from "@/types";

const blank: Competition = {
  id: "", title: "", slug: "", banner: "", difficulty: "Beginner",
  prizePool: 0, countriesAllowed: ["All Countries"], registrationDeadline: "",
  eventTimeline: [], requiredSkills: [], entryFee: 0, availableSlots: 0,
  totalSlots: 0, status: "upcoming", organizer: "", rules: [],
  judgingCriteria: [], description: "", maxVideoDuration: 300, maxVideoSize: 100,
};

const diffColors: Record<string, "green" | "blue" | "yellow" | "red"> = {
  Beginner: "green", Intermediate: "blue", Professional: "yellow", Master: "red",
};

export default function AdminCompetitionsPage() {
  const { supportedCountries } = useAdminData();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [editing, setEditing] = useState<Competition | null>(null);
  const [draft, setDraft] = useState<Competition>(blank);
  const [deleting, setDeleting] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCompetitions();
  }, []);

  async function fetchCompetitions() {
    try {
      const res = await fetch("/api/competitions");
      const data = await res.json();
      console.log("Fetched competitions:", data);
      setCompetitions(data);
    } catch (error) {
      console.error("Error fetching competitions:", error);
    } finally {
      setLoading(false);
    }
  }

  const allCountriesValue = "All Countries";
  const isAllCountries = draft.countriesAllowed.includes(allCountriesValue);

  function toggleAllCountries(all: boolean) {
    setDraft(d => ({ ...d, countriesAllowed: all ? [allCountriesValue] : [] }));
  }

  function toggleCountry(name: string) {
    setDraft(d => {
      const without = d.countriesAllowed.filter(c => c !== allCountriesValue);
      return {
        ...d,
        countriesAllowed: without.includes(name)
          ? without.filter(c => c !== name)
          : [...without, name],
      };
    });
  }

  function openAdd() { setDraft({ ...blank, id: "" }); setEditing(draft); }
  function openEdit(c: Competition) { setDraft({ ...c }); setEditing(c); }
  function closeModal() { setEditing(null); }

  async function save() {
    setSaving(true);
    try {
      const exists = competitions.find((c) => c.id === draft.id);
      const method = exists ? "PUT" : "POST";
      
      console.log("Saving competition:", draft);
      
      const res = await fetch("/api/competitions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      
      const result = await res.json();
      console.log("Save response:", result);
      
      if (res.ok) {
        // For new competitions, use the database-generated ID returned from the API
        if (!exists && result.id) {
          setDraft(d => ({ ...d, id: result.id }));
        }
        await fetchCompetitions();
        closeModal();
      } else {
        console.error("Save failed:", result);
        alert("Failed to save: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving competition:", error);
      alert("Error saving competition: " + error);
    } finally {
      setSaving(false);
    }
  }

  function del(c: Competition) {
    setDeleting(c);
  }

  async function confirmDelete() {
    console.log("=== CONFIRM DELETE CALLED ===");
    console.log("Deleting competition:", deleting);
    if (deleting && deleting.id) {
      try {
        console.log("Making DELETE request to:", `/api/competitions?id=${deleting.id}`);
        const res = await fetch(`/api/competitions?id=${deleting.id}`, {
          method: "DELETE",
        });
        console.log("DELETE response status:", res.status);
        console.log("DELETE response ok:", res.ok);
        if (res.ok) {
          await fetchCompetitions();
          setDeleting(null);
        } else {
          const errorText = await res.text();
          console.error("DELETE failed with status:", res.status);
          console.error("Error response:", errorText);
          alert(`Failed to delete: ${errorText}`);
        }
      } catch (error) {
        console.error("Error deleting competition:", error);
        alert("Error deleting competition");
      }
    } else {
      console.error("Cannot delete: competition or ID is missing", deleting);
      alert("Cannot delete: competition ID is missing. Please refresh and try again.");
    }
  }

  const set = (k: keyof Competition) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = (e.target as HTMLInputElement).type === "number" ? Number(e.target.value) : e.target.value;
    setDraft((d) => ({ ...d, [k]: value }));
  };

  const filteredCompetitions = competitions.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.organizer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Competitions</h1>
        <p className="text-muted text-sm">Add, edit, or remove competition listings.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search competitions by title, organizer..."
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
          title={`Competitions (${filteredCompetitions.length})`}
          items={filteredCompetitions}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={del}
        columns={[
          {
            label: "Title",
            render: (c) => (
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted">{c.organizer}</p>
              </div>
            ),
          },
          { label: "Difficulty", render: (c) => <Badge variant={diffColors[c.difficulty] ?? "default"}>{c.difficulty}</Badge> },
          { label: "Prize Pool", render: (c) => <span className="text-green font-medium">RWF {c.prizePool.toLocaleString()}</span> },
          { label: "Fee", render: (c) => `RWF ${c.entryFee}` },
          {
            label: "Status",
            render: (c) => (
              <Badge
                variant={
                  c.status === "open"
                    ? "green"
                    : c.status === "upcoming"
                    ? "blue"
                    : c.status === "judging"
                    ? "yellow"
                    : "default"
                }
              >
                {c.status}
              </Badge>
            ),
          },
          { label: "Available Slots", render: (c) => c.availableSlots },
          { label: "Total Slots", render: (c) => c.totalSlots },
        ]}
      />
      )}

      {editing !== null && (
        <AdminModal
          title={draft.id && competitions.find(c => c.id === draft.id) ? "Edit Competition" : "Add Competition"}
          onClose={closeModal}
          onSave={save}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" required><Input value={draft.title} onChange={set("title")} /></Field>
            <Field label="Slug"><Input value={draft.slug} onChange={set("slug")} placeholder="my-competition-2026" /></Field>
          </div>
          <Field label="Description"><Textarea value={draft.description} onChange={set("description")} /></Field>
          <Field label="Banner Image">
            <ImageUpload value={draft.banner} onChange={(url) => setDraft(d => ({ ...d, banner: url }))} aspectRatio="banner" allowCrop />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max Video Duration (sec)">
              <Input type="number" min={1} value={draft.maxVideoDuration} onChange={set("maxVideoDuration")} />
            </Field>
            <Field label="Max Video Size (MB)">
              <Input type="number" min={1} value={draft.maxVideoSize} onChange={set("maxVideoSize")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Organizer"><Input value={draft.organizer} onChange={set("organizer")} /></Field>
            <Field label="Difficulty">
              <Select
                value={draft.difficulty}
                onChange={set("difficulty")}
                options={[
                  { value: "Beginner", label: "Beginner" },
                  { value: "Intermediate", label: "Intermediate" },
                  { value: "Professional", label: "Professional" },
                  { value: "Master", label: "Master" },
                ]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Prize Pool (RWF)"><Input type="number" value={draft.prizePool} onChange={(e) => setDraft(d => ({ ...d, prizePool: Number(e.target.value) }))} /></Field>
            <Field label="Entry Fee (RWF)"><Input type="number" value={draft.entryFee} onChange={(e) => setDraft(d => ({ ...d, entryFee: Number(e.target.value) }))} /></Field>
            <Field label="Status">
              <Select
                value={draft.status}
                onChange={set("status")}
                options={[
                  { value: "upcoming", label: "Upcoming" },
                  { value: "open", label: "Open" },
                  { value: "judging", label: "Judging" },
                  { value: "completed", label: "Completed" },
                ]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Available Slots"><Input type="number" value={draft.availableSlots} onChange={(e) => setDraft(d => ({ ...d, availableSlots: Number(e.target.value) }))} /></Field>
            <Field label="Total Slots"><Input type="number" value={draft.totalSlots} onChange={(e) => setDraft(d => ({ ...d, totalSlots: Number(e.target.value) }))} /></Field>
          </div>
          <Field label="Registration Deadline"><Input type="date" value={draft.registrationDeadline} onChange={set("registrationDeadline")} /></Field>
          <Field label="Event Timeline (one per line: date | event)">
            <Textarea
              rows={4}
              value={draft.eventTimeline.map((e) => `${e.date} | ${e.event}`).join("\n")}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  eventTimeline: e.target.value.split("\n").map((line) => {
                    const [date, ...eventParts] = line.split("|");
                    return { date: (date || "").trim(), event: eventParts.join("|").trim() };
                  }).filter((e) => e.date || e.event),
                }))
              }
            />
          </Field>
          <Field label="Rules (one per line)">
            <Textarea rows={4} value={draft.rules.join("\n")} onChange={(e) => setDraft(d => ({ ...d, rules: e.target.value.split("\n") }))} />
          </Field>
          <Field label="Judging Criteria (one per line)">
            <Textarea rows={3} value={draft.judgingCriteria.join("\n")} onChange={(e) => setDraft(d => ({ ...d, judgingCriteria: e.target.value.split("\n") }))} />
          </Field>
          <Field label="Required Skills (comma separated)">
            <Input value={draft.requiredSkills.join(", ")} onChange={(e) => setDraft(d => ({ ...d, requiredSkills: e.target.value.split(",").map(s => s.trim()) }))} />
          </Field>
          <Field label="Countries Allowed">
            <div className="space-y-3">
              {/* All Countries toggle */}
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted-bg border border-white/10 cursor-pointer hover:border-blue/40 transition-colors">
                <input
                  type="checkbox"
                  checked={isAllCountries}
                  onChange={(e) => toggleAllCountries(e.target.checked)}
                  className="h-4 w-4 rounded accent-blue"
                />
                <Globe className="h-4 w-4 text-blue" />
                <span className="text-sm font-medium">All Countries</span>
                {isAllCountries && <span className="ml-auto text-xs text-blue">✓ Open worldwide</span>}
              </label>

              {/* Individual country picker — shown when not "All Countries" */}
              {!isAllCountries && (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="px-3 py-2 bg-muted-bg border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs text-muted">
                      {draft.countriesAllowed.length} of {supportedCountries.length} selected
                    </span>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setDraft(d => ({ ...d, countriesAllowed: supportedCountries.map(c => c.name) }))} className="text-xs text-blue hover:underline">Select all</button>
                      <button type="button" onClick={() => setDraft(d => ({ ...d, countriesAllowed: [] }))} className="text-xs text-muted hover:text-foreground">Clear</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-white/5 max-h-52 overflow-y-auto">
                    {supportedCountries.map((country) => {
                      const selected = draft.countriesAllowed.includes(country.name);
                      return (
                        <label
                          key={country.code}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                            selected ? "bg-blue/10" : "bg-background hover:bg-white/3"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleCountry(country.name)}
                            className="h-3.5 w-3.5 rounded accent-blue shrink-0"
                          />
                          <span className="text-base leading-none">{country.flag}</span>
                          <span className="text-xs truncate">{country.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Field>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Competition"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.title}</span>?</>}
          confirmLabel="Delete Competition"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
