"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, Check, X, Mail, ExternalLink, Clock, Trash2, Archive, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { validatePhoneNumber } from "@/lib/phone-utils";
import { formatCurrency } from "@/lib/utils";

interface Application {
  id: string;
  status: string;
  fullName?: string;
  country?: string;
  mobileNumber?: string;
  email?: string;
  birthDate?: string;
  experience: string;
  skills: string;
  motivation: string;
  videoUrl?: string;
  profilePhotoUrl?: string;
  paymentStatus: string;
  createdAt: string;
  competitionId: string;
  userId: string;
  accessLink?: string | null;
  accessLinkExpiresAt?: string | null;
  nominatedAt?: string | null;
  paidAt?: string | null;
  competitions?: {
    id: string;
    title: string;
    entryFee: number;
  };
}

type ApplicationStatus = "pending" | "nominated" | "active" | "rejected" | "archived" | "revoked";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("all");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Application>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function showError(msg: string) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const response = await fetch("/api/competitions/apply");
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  }

  function toggleRow(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  async function handleBulkAction(action: "delete" | "archive" | "revoke" | "activate") {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (action === "delete") {
      const confirmed = window.confirm(`Are you sure you want to delete ${selectedCount} selected application(s)? This action cannot be undone.`);
      if (!confirmed) return;
    }

    try {
      const response = await fetch("/api/competitions/applications/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        await fetchApplications();
      } else {
        const data = await response.json().catch(() => ({}));
        showError(data.error || "Failed to perform bulk action");
      }
    } catch (error) {
      console.error("Bulk action error:", error);
      showError("Failed to perform bulk action");
    }
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "nominated":
      case "active":
        return "green";
      case "rejected":
      case "revoked":
        return "red";
      case "archived":
        return "default";
      default:
        return "yellow";
    }
  }

  async function updateApplicationStatus(id: string, status: string) {
    try {
      const response = await fetch(`/api/competitions/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        fetchApplications();
        setShowModal(false);
      } else {
        showError("Failed to update application");
      }
    } catch (error) {
      console.error("Failed to update application:", error);
      showError("Failed to update application");
    }
  }

  async function nominateApplication(id: string) {
    try {
      const response = await fetch(`/api/competitions/applications/${id}/nominate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const updated = await response.json();
        await fetchApplications();
        // Keep the modal open and show the generated access link so admin can send the email
        setSelectedApp(updated);
      } else {
        showError("Failed to nominate applicant");
      }
    } catch (error) {
      console.error("Failed to nominate application:", error);
      showError("Failed to nominate applicant");
    }
  }

  function sendCongratulationEmail(app: Application) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const accessUrl = `${origin}/access/${app.accessLink}`;
    const expiry = app.accessLinkExpiresAt
      ? new Date(app.accessLinkExpiresAt).toLocaleString()
      : "3 days from now";
    const subject = `Congratulations! You have been nominated for ${app.competitions?.title || "the competition"}`;
    const bodyLines = [
      `Dear ${app.fullName || "Applicant"},`,
      "",
      `Congratulations! Your application for ${app.competitions?.title || "the competition"} has been reviewed and you have been NOMINATED to participate.`,
      "",
      `To secure your spot, please complete your entry-fee payment of ${formatCurrency(app.competitions?.entryFee ?? 0, "RWF")} using your personal access link below:`,
      "",
      accessUrl,
      "",
      `IMPORTANT: This access link is temporary and will expire on ${expiry}. You must complete payment before it expires.`,
      "",
      "After successful payment, you will gain access to your participant dashboard where you can track your progress, submit entries, and view live rankings.",
      "",
      "We look forward to seeing you compete!",
      "",
      "Warm regards,",
      "The Mubarista Team",
    ];
    window.open(
      `mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`
    );
  }

  async function updateApplication(id: string, data: Partial<Application>) {
    if (data.mobileNumber) {
      const validation = validatePhoneNumber(data.mobileNumber);
      if (!validation.valid) {
        showError(validation.error || "Invalid mobile number");
        return;
      }
    }
    try {
      const response = await fetch(`/api/competitions/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        fetchApplications();
        setIsEditing(false);
        setShowModal(false);
      } else {
        showError("Failed to update application");
      }
    } catch (error) {
      console.error("Failed to update application:", error);
      showError("Failed to update application");
    }
  }

  function startEditing() {
    if (selectedApp) {
      setEditData({
        fullName: selectedApp.fullName,
        country: selectedApp.country,
        mobileNumber: selectedApp.mobileNumber,
        email: selectedApp.email,
        birthDate: selectedApp.birthDate,
        experience: selectedApp.experience,
        skills: selectedApp.skills,
        motivation: selectedApp.motivation,
        videoUrl: selectedApp.videoUrl,
        profilePhotoUrl: selectedApp.profilePhotoUrl,
      });
      setIsEditing(true);
    }
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditData({});
  }

  const filtered = applications.filter((app) => {
    if (filter !== "all" && app.status !== filter) return false;
    if (search && !app.fullName?.toLowerCase().includes(search.toLowerCase()) && !app.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredIds = filtered.map((app) => app.id);
  const selectedCount = selectedIds.size;
  const allSelected = filtered.length > 0 && filtered.every((app) => selectedIds.has(app.id));

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    nominated: applications.filter((a) => a.status === "nominated").length,
    active: applications.filter((a) => a.status === "active").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    archived: applications.filter((a) => a.status === "archived").length,
    revoked: applications.filter((a) => a.status === "revoked").length,
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CardTitle className="text-2xl mb-6">Applications Management</CardTitle>
          <p className="text-muted">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      {errorMsg && (
        <div className="fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg bg-red text-white text-sm flex items-center gap-2">
          <X className="h-4 w-4" />
          {errorMsg}
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <CardTitle className="text-2xl">Applications Management</CardTitle>
            <p className="text-muted text-sm mt-1">Review and manage competition applications</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted">Total Applications</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-yellow">{stats.pending}</p>
            <p className="text-xs text-muted">Pending Review</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-green">{stats.nominated}</p>
            <p className="text-xs text-muted">Nominated</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-green">{stats.active}</p>
            <p className="text-xs text-muted">Active</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-red">{stats.rejected}</p>
            <p className="text-xs text-muted">Rejected</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-muted">{stats.archived}</p>
            <p className="text-xs text-muted">Archived</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-red">{stats.revoked}</p>
            <p className="text-xs text-muted">Revoked</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl bg-muted-bg border border-white/10 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {(["all", "pending", "nominated", "active", "rejected", "archived", "revoked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                  filter === f
                    ? "bg-blue text-white"
                    : "bg-muted-bg text-muted hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl bg-muted-bg border border-white/10">
            <span className="text-sm text-muted">
              {allSelected ? "All" : selectedCount} selected
            </span>
            <div className="flex-1" />
            <button
              onClick={() => handleBulkAction("activate")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green/15 text-green hover:bg-green/20 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Activate
            </button>
            <button
              onClick={() => handleBulkAction("archive")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted-bg text-muted hover:bg-white/10 transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
            <button
              onClick={() => handleBulkAction("revoke")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red/15 text-red hover:bg-red/20 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              Revoke
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red/15 text-red hover:bg-red/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}

        {/* Applications Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-muted-bg/50">
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-white/20 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted">Competition</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted">Experience</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted">Applied</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleRow(app.id)}
                        className="h-4 w-4 rounded border-white/20 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{app.fullName || "N/A"}</p>
                        <p className="text-xs text-muted">{app.email || "N/A"}</p>
                        {app.country && <p className="text-xs text-muted">{app.country}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{app.competitions?.title || "N/A"}</p>
                      <p className="text-xs text-muted">{formatCurrency(app.competitions?.entryFee ?? 0, "RWF")} entry fee</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="blue" className="text-xs capitalize">
                        {app.experience}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={getStatusBadgeVariant(app.status)}
                        className="text-xs capitalize"
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={app.paymentStatus === "paid" ? "green" : "yellow"}
                        className="text-xs capitalize"
                      >
                        {app.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted">No applications found</div>
          )}
        </Card>

        {/* Application Detail Modal */}
        {showModal && selectedApp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <CardTitle>{isEditing ? "Edit Application" : "Application Details"}</CardTitle>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={startEditing}
                    >
                      Edit
                    </Button>
                  )}
                  <button onClick={() => { setShowModal(false); setIsEditing(false); }} className="text-muted hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm text-muted mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={editData.fullName || ""}
                      onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-1 block">Email</label>
                    <input
                      type="email"
                      value={editData.email || ""}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-1 block">Mobile Number</label>
                    <PhoneInput
                      value={editData.mobileNumber || ""}
                      onChange={(value) => setEditData({ ...editData, mobileNumber: value })}
                      placeholder="788123456"
                      className="w-full"
                    />
                    <p className="text-xs text-muted mt-1">Format: +{`{country code}`} followed by up to 9 digits</p>
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-1 block">Birth Date</label>
                    <input
                      type="date"
                      value={editData.birthDate || ""}
                      onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-1 block">Country</label>
                    <input
                      type="text"
                      value={editData.country || ""}
                      onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-1 block">Experience Level</label>
                    <select
                      value={editData.experience || ""}
                      onChange={(e) => setEditData({ ...editData, experience: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    >
                      <option value="">Select experience level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-1 block">Skills</label>
                    <textarea
                      value={editData.skills || ""}
                      onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-1 block">Motivation</label>
                    <textarea
                      value={editData.motivation || ""}
                      onChange={(e) => setEditData({ ...editData, motivation: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-1 block">Video URL</label>
                    <input
                      type="url"
                      value={editData.videoUrl || ""}
                      onChange={(e) => setEditData({ ...editData, videoUrl: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted mb-1 block">Profile Photo URL</label>
                    <input
                      type="url"
                      value={editData.profilePhotoUrl || ""}
                      onChange={(e) => setEditData({ ...editData, profilePhotoUrl: e.target.value })}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => updateApplication(selectedApp.id, editData)}
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={cancelEditing}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-muted mb-1">Applicant</p>
                    <p className="font-medium">{selectedApp.fullName || "N/A"}</p>
                    <p className="text-sm text-muted">{selectedApp.email || "N/A"}</p>
                    {selectedApp.mobileNumber && <p className="text-sm text-muted">{selectedApp.mobileNumber}</p>}
                    {selectedApp.birthDate && <p className="text-sm text-muted">DOB: {new Date(selectedApp.birthDate).toLocaleDateString()}</p>}
                    {selectedApp.country && <p className="text-sm text-muted">{selectedApp.country}</p>}
                  </div>

                  <div>
                    <p className="text-sm text-muted mb-1">Competition</p>
                    <p className="font-medium">{selectedApp.competitions?.title || "N/A"}</p>
                    <p className="text-sm text-muted">Entry Fee: {formatCurrency(selectedApp.competitions?.entryFee ?? 0, "RWF")}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted mb-1">Experience Level</p>
                    <Badge variant="blue" className="capitalize">
                      {selectedApp.experience}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted mb-1">Skills</p>
                    <p className="text-sm">{selectedApp.skills}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted mb-1">Motivation</p>
                    <p className="text-sm">{selectedApp.motivation}</p>
                  </div>

                  {selectedApp.videoUrl && (
                    <div>
                      <p className="text-sm text-muted mb-1">Video Rules</p>
                      <a
                        href={selectedApp.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue hover:underline"
                      >
                        View Video
                      </a>
                    </div>
                  )}

                  {selectedApp.profilePhotoUrl && (
                    <div>
                      <p className="text-sm text-muted mb-1">Profile Photo</p>
                      <img
                        src={selectedApp.profilePhotoUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    </div>
                  )}

                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-muted mb-1">Status</p>
                      <Badge
                        variant={getStatusBadgeVariant(selectedApp.status)}
                        className="capitalize"
                      >
                        {selectedApp.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted mb-1">Payment Status</p>
                      <Badge
                        variant={selectedApp.paymentStatus === "paid" ? "green" : "yellow"}
                        className="capitalize"
                      >
                        {selectedApp.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  {selectedApp.status === "nominated" && selectedApp.accessLink && (
                    <div className="p-3 rounded-xl bg-blue/10 border border-blue/30">
                      <p className="text-sm text-muted mb-1">Temporary Access Link</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs flex-1 break-all">
                          {typeof window !== "undefined" ? window.location.origin : ""}/access/{selectedApp.accessLink}
                        </code>
                        <a
                          href={`/access/${selectedApp.accessLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-blue/20 text-blue"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      {selectedApp.accessLinkExpiresAt && (
                        <p className="text-xs text-muted mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {new Date(selectedApp.accessLinkExpiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isEditing && selectedApp.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => nominateApplication(selectedApp.id)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Nominate
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => updateApplicationStatus(selectedApp.id, "rejected")}
                    className="flex-1 bg-red hover:bg-red/90"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {!isEditing && selectedApp.status === "nominated" && (
                <Button
                  variant="primary"
                  onClick={() => sendCongratulationEmail(selectedApp)}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Congratulation Email
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
