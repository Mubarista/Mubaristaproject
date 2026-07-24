"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabaseAdminAuth } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { LoadingDots } from "@/components/ui/loading-dots";
import { AdminModal, Field, Select, Input } from "@/components/admin/admin-modal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface Role {
  id: string;
  name: string;
  permissions?: any[];
}

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  roleId: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  roles?: Role;
}

export default function TeamPage() {
  const { isSuper } = useAdminAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState<TeamMember | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [draft, setDraft] = useState({
    email: "",
    password: "",
    name: "",
    roleId: "",
    expiresAt: "",
    isActive: true,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getToken() {
    const { data } = await supabaseAdminAuth.auth.getSession();
    return data.session?.access_token || "";
  }

  async function loadData() {
    setLoading(true);
    const token = await getToken();
    try {
      const [mRes, rRes] = await Promise.all([
        fetch("/api/team?includeInactive=true", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/team/roles", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (mRes.ok) setMembers(await mRes.json());
      if (rRes.ok) setRoles(await rRes.json());
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  function generatePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pw = "";
    for (let i = 0; i < 12; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDraft((d) => ({ ...d, password: pw }));
    setShowPassword(true);
  }

  function openAdd() {
    setEditing(null);
    setDraft({ email: "", password: "", name: "", roleId: roles[0]?.id || "", expiresAt: "", isActive: true });
    setShowModal(true);
  }

  function openEdit(member: TeamMember) {
    setEditing(member);
    setDraft({
      email: member.email,
      password: "",
      name: member.name || "",
      roleId: member.roleId,
      expiresAt: member.expiresAt ? new Date(member.expiresAt).toISOString().slice(0, 10) : "",
      isActive: member.isActive,
    });
    setShowModal(true);
  }

  async function save() {
    setSaving(true);
    const token = await getToken();
    try {
      const url = "/api/team";
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? { id: editing.id, ...draft, expiresAt: new Date(draft.expiresAt).toISOString() }
        : {
            email: draft.email,
            password: draft.password,
            name: draft.name,
            roleId: draft.roleId,
            expiresAt: new Date(draft.expiresAt).toISOString(),
          };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save team member");
      }
    } catch (error) {
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!showDelete) return;
    setSaving(true);
    const token = await getToken();
    try {
      const res = await fetch(`/api/team?id=${showDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setShowDelete(null);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete team member");
      }
    } catch (error) {
    } finally {
      setSaving(false);
    }
  }

  if (!isSuper) {
    return (
      <div className="pt-24 pb-16 px-4">
        <Card className="max-w-xl mx-auto p-8 text-center">
          <CardTitle>Access Denied</CardTitle>
          <p className="text-muted mt-2">Only Super Admins can manage the team.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Mubarista Team</h1>
            <p className="text-muted text-sm">Manage sub-admin accounts, roles, and access expiration.</p>
          </div>
          <Button onClick={openAdd} variant="primary">Add Team Member</Button>
        </div>

        {loading ? (
          <div className="py-12 text-center"><LoadingDots /></div>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted-bg text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">{m.name || "—"}</td>
                    <td className="px-4 py-3">{m.email}</td>
                    <td className="px-4 py-3">{m.roles?.name || m.roleId}</td>
                    <td className="px-4 py-3">{new Date(m.expiresAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${m.isActive ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="secondary" className="h-8 text-xs" onClick={() => openEdit(m)}>Edit</Button>
                      <Button variant="secondary" className="h-8 text-xs" onClick={() => setShowDelete(m)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length === 0 && (
              <div className="p-8 text-center text-muted">No team members yet.</div>
            )}
          </Card>
        )}
      </div>

      {showModal && (
        <AdminModal
          title={editing ? "Edit Team Member" : "Add Team Member"}
          onClose={() => setShowModal(false)}
          onSave={save}
        >
          <Field label="Name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
          {!editing && (
            <>
              <Field label="Email" required><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
              <Field label="Initial Password" required>
                <div className="relative flex items-center">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={draft.password}
                    onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                    className="pr-24"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-12 p-1.5 text-muted hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="absolute right-2 px-2 py-1 text-xs font-medium rounded-md bg-blue/10 text-blue hover:bg-blue/20 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </Field>
            </>
          )}
          <Field label="Role" required>
            <Select
              value={draft.roleId}
              onChange={(e) => setDraft({ ...draft, roleId: e.target.value })}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Field>
          <Field label="Access Expires" required>
            <Input type="date" value={draft.expiresAt} onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })} />
          </Field>
          {editing && (
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="isActive"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="text-sm text-muted">Account active</label>
            </div>
          )}
        </AdminModal>
      )}

      {showDelete && (
        <ConfirmDialog
          title="Remove Team Member"
          message={`Delete ${showDelete.email} from the team? This will also delete their login account.`}
          onConfirm={remove}
          onCancel={() => setShowDelete(null)}
          isLoading={saving}
        />
      )}
    </div>
  );
}
