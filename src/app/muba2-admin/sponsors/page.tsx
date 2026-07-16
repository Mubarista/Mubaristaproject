"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, X, Check, Search } from "lucide-react";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminModal, Field, Input } from "@/components/admin/admin-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingDots } from "@/components/ui/loading-dots";

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const blank: Sponsor = { id: "", name: "", logo: "", active: true, order: 0, createdAt: "", updatedAt: "" };

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [draft, setDraft] = useState<Sponsor>(blank);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; sponsor: Sponsor | null }>({ show: false, sponsor: null });
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSponsors();
  }, []);

  async function fetchSponsors() {
    try {
      const response = await fetch("/api/sponsors");
      if (response.ok) {
        const data = await response.json();
        setSponsors(data);
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { setDraft({ ...blank, id: "" }); setEditing({ ...blank, id: "" }); }
  function openEdit(s: Sponsor) { setDraft({ ...s }); setEditing(s); }
  function closeModal() { setEditing(null); }

  async function save() {
    try {
      if (editing!.id) {
        // Update existing
        const response = await fetch(`/api/sponsors/${editing!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: draft.name, logo: draft.logo }),
        });
        if (response.ok) {
          setNotification({ show: true, message: "Sponsor updated successfully", type: "success" });
          await fetchSponsors();
        }
      } else {
        // Create new
        const response = await fetch("/api/sponsors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: draft.name, logo: draft.logo }),
        });
        if (response.ok) {
          setNotification({ show: true, message: "Sponsor added successfully", type: "success" });
          await fetchSponsors();
        }
      }
      closeModal();
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    } catch (error) {
      console.error("Error saving sponsor:", error);
      setNotification({ show: true, message: "Failed to save sponsor", type: "error" });
    }
  }

  function del(s: Sponsor) {
    setDeleteConfirm({ show: true, sponsor: s });
  }

  async function confirmDelete() {
    if (deleteConfirm.sponsor) {
      try {
        const response = await fetch(`/api/sponsors/${deleteConfirm.sponsor.id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setDeleteConfirm({ show: false, sponsor: null });
          setNotification({ show: true, message: "Sponsor removed successfully", type: "success" });
          await fetchSponsors();
          setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
        }
      } catch (error) {
        console.error("Error deleting sponsor:", error);
        setNotification({ show: true, message: "Failed to delete sponsor", type: "error" });
      }
    }
  }

  function cancelDelete() {
    setDeleteConfirm({ show: false, sponsor: null });
  }

  const filteredSponsors = sponsors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Notification Toast */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
            notification.type === "success" ? "bg-green text-white" : "bg-red text-white"
          }`}
        >
          <Check className="h-4 w-4" />
          {notification.message}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.sponsor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red" />
              </div>
              <div>
                <h3 className="font-semibold">Remove Sponsor</h3>
                <p className="text-sm text-muted">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm mb-6">
              Are you sure you want to remove <span className="font-semibold">{deleteConfirm.sponsor.name}</span> from the sponsors list?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmDelete} className="bg-red hover:bg-red/90">
                Remove Sponsor
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sponsors</h1>
        <p className="text-muted text-sm">Manage trusted industry sponsors displayed on the homepage.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search sponsors by name..."
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
          title={`Sponsors (${filteredSponsors.length})`}
          items={filteredSponsors}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={del}
          columns={[
            {
              label: "Logo Badge",
              render: (s) => (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue/10 text-blue text-xs font-bold">
                  {s.logo}
                </span>
              ),
            },
            { label: "Brand Name", render: (s) => <span className="font-medium">{s.name}</span> },
          ]}
        />
      )}

      {editing && (
        <AdminModal
          title={editing.id ? "Edit Sponsor" : "Add Sponsor"}
          onClose={closeModal}
          onSave={save}
        >
          <Field label="Brand Name" required>
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </Field>
          <Field label="Logo Abbreviation (2–3 chars)">
            <Input value={draft.logo} onChange={(e) => setDraft((d) => ({ ...d, logo: e.target.value }))} maxLength={3} placeholder="LM" />
          </Field>
        </AdminModal>
      )}
    </div>
  );
}
