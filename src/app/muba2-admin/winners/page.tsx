"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input, ImageUpload, CountrySelect, Select, DatePicker } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const blank = { id: "", name: "", country: "", competition: "", year: "", winDate: "", winType: "week", prize: "", currency: "RWF", image: "", artImage: "" };

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>(blank);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWinners();
    fetchCompetitions();
    fetchApplications();
  }, []);

  async function fetchWinners() {
    try {
      const res = await fetch("/api/winners");
      const data = await res.json();
      setWinners(data);
    } catch (error) {
      console.error("Error fetching winners:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompetitions() {
    try {
      const res = await fetch("/api/competitions");
      const data = await res.json();
      setCompetitions(data);
    } catch (error) {
      console.error("Error fetching competitions:", error);
    }
  }

  async function fetchApplications() {
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  }

  function handleParticipantSelect(applicationId: string) {
    const application = applications.find((a) => a.id === applicationId);
    if (application) {
      setDraft((d: any) => ({
        ...d,
        name: application.fullName || application.user?.name,
        country: application.country || application.user?.country,
        image: application.user?.avatar || "",
        competition: application.competition?.title || application.competitions?.title || "",
      }));
    }
  }

  function formatNumberWithCommas(value: string): string {
    const numbers = value.replace(/,/g, "").replace(/[^0-9]/g, "");
    if (!numbers) return "";
    return Number(numbers).toLocaleString();
  }

  function handlePrizeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const numbers = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
    const formatted = formatNumberWithCommas(numbers);
    setDraft((d: any) => ({ ...d, prize: formatted }));
  }

  function openAdd() { const d = { ...blank, id: String(Date.now()) }; setDraft(d); setEditing(d); }
  function openEdit(w: any) { setDraft({ ...w, prize: w.prize || "", currency: w.currency || "RWF", winType: w.winType || "week" }); setEditing(w); }
  function closeModal() { setEditing(null); }

  async function save() {
    try {
      const exists = winners.find((w) => w.id === draft.id);
      const method = exists ? "PUT" : "POST";
      
      console.log("Saving winner:", draft);
      
      const res = await fetch("/api/winners", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      
      const result = await res.json();
      console.log("Save response:", result);
      
      if (res.ok) {
        // For new winners, use the database-generated ID returned from the API
        if (!exists && result.id) {
          setDraft((d: any) => ({ ...d, id: result.id }));
        }
        await fetchWinners();
        closeModal();
      } else {
        console.error("Save failed:", result);
        alert("Failed to save: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving winner:", error);
      alert("Error saving winner: " + error);
    }
  }

  function del(w: any) {
    setDeleting(w);
  }

  async function confirmDelete() {
    console.log("=== CONFIRM DELETE CALLED ===");
    console.log("Deleting winner:", deleting);
    if (deleting && deleting.id) {
      try {
        console.log("Making DELETE request to:", `/api/winners?id=${deleting.id}`);
        const res = await fetch(`/api/winners?id=${deleting.id}`, {
          method: "DELETE",
        });
        console.log("DELETE response status:", res.status);
        console.log("DELETE response ok:", res.ok);
        if (res.ok) {
          await fetchWinners();
          setDeleting(null);
        } else {
          const errorText = await res.text();
          console.error("DELETE failed with status:", res.status);
          console.error("Error response:", errorText);
          alert(`Failed to delete: ${errorText}`);
        }
      } catch (error) {
        console.error("Error deleting winner:", error);
        alert("Error deleting winner");
      }
    } else {
      console.error("Cannot delete: winner or ID is missing", deleting);
      alert("Cannot delete: winner ID is missing. Please refresh and try again.");
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d: any) => ({ ...d, [k]: e.target.value }));

  const filteredWinners = winners.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.competition.toLowerCase().includes(search.toLowerCase()) ||
    w.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Winners</h1>
        <p className="text-muted text-sm">Manage the Hall of Fame winner profiles.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search winners by name, competition, country..."
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
          title={`Winners (${filteredWinners.length})`}
          items={filteredWinners}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={del}
          columns={[
            {
              label: "Barista",
              render: (w) => (
                <div className="flex items-center gap-3">
                  {w.image && (
                    <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
                      <Image src={w.image} alt={w.name} fill sizes="40px" className="object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{w.name}</p>
                    <p className="text-xs text-muted">{w.country}</p>
                  </div>
                </div>
              ),
            },
            { label: "Competition", render: (w) => w.competition },
            { label: "Type", render: (w) => w.winType || "week" },
            { label: "Prize", render: (w) => w.prize ? <span className="text-green font-semibold">{w.prize} {w.currency || "RWF"}</span> : <span className="text-muted">-</span> },
          ]}
        />
      )}

      {editing && (
        <AdminModal
          title={winners.find((w: any) => w.id === draft.id) ? "Edit Winner" : "Add Winner"}
          onClose={closeModal}
          onSave={save}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <div className="space-y-2">
                <Select
                  value={draft.name}
                  onChange={(e) => handleParticipantSelect(e.target.value)}
                  options={[
                    { value: "", label: "Select participant..." },
                    ...applications.map((a) => ({
                      value: a.id,
                      label: `${a.fullName || a.user?.name || "Unknown"} - ${a.competition?.title || a.competitions?.title || "Unknown Competition"}`,
                    })),
                  ]}
                />
                <Input value={draft.name} onChange={set("name")} placeholder="Or enter manually" />
              </div>
            </Field>
            <Field label="Country" required>
              <CountrySelect value={draft.country} onChange={(c) => setDraft((d: any) => ({ ...d, country: c }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Competition" required>
              <Select
                value={draft.competition}
                onChange={(e) => setDraft((d: any) => ({ ...d, competition: e.target.value }))}
                options={[
                  { value: "", label: "Select competition..." },
                  ...competitions.map((c) => ({ value: c.title, label: c.title })),
                ]}
              />
            </Field>
            <Field label="Year" required>
              <Input value={draft.year} onChange={set("year")} placeholder="2026" />
            </Field>
          </div>
          <Field label="Win Date">
            <DatePicker value={draft.winDate || ""} onChange={(date) => setDraft((d: any) => ({ ...d, winDate: date }))} />
          </Field>
          <Field label="Winner Type">
            <Select
              value={draft.winType || "week"}
              onChange={(e) => setDraft((d: any) => ({ ...d, winType: e.target.value }))}
              options={[
                { value: "today", label: "Winner of today" },
                { value: "week", label: "Winner of the week" },
                { value: "month", label: "Winner of the month" },
                { value: "year", label: "Winner of the year" },
                { value: "season", label: "Winner of the season" },
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prize">
              <Input value={draft.prize || ""} onChange={handlePrizeChange} placeholder="1,000,000" />
            </Field>
            <Field label="Currency">
              <Select
                value={draft.currency || "RWF"}
                onChange={(e) => setDraft((d: any) => ({ ...d, currency: e.target.value }))}
                options={[
                  { value: "RWF", label: "RWF" },
                  { value: "USD", label: "USD" },
                ]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Profile Image">
              <ImageUpload value={draft.image} onChange={(url) => setDraft((d: any) => ({ ...d, image: url }))} aspectRatio="square" />
            </Field>
            <Field label="Latte Art Image">
              <ImageUpload value={draft.artImage} onChange={(url) => setDraft((d: any) => ({ ...d, artImage: url }))} aspectRatio="square" />
            </Field>
          </div>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Winner"
          message={<>Are you sure you want to delete <span className="font-semibold">{deleting.name}</span>?</>}
          confirmLabel="Delete Winner"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
