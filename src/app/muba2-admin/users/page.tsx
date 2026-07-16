"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, Shield, Crown, UserX, Check, X, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  country: string | null;
  role: string;
  isPremium: boolean;
  active: boolean;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "premium" | "free" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function togglePremium(id: string) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const updated = { ...user, isPremium: !user.isPremium };
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (response.ok) {
        const result = await response.json();
        setUsers(users.map(u => u.id === id ? result : u));
      }
    } catch (error) {
      console.error("Failed to toggle premium:", error);
    }
  }

  async function toggleActive(id: string) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const updated = { ...user, active: !user.active };
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (response.ok) {
        const result = await response.json();
        setUsers(users.map(u => u.id === id ? result : u));
      }
    } catch (error) {
      console.error("Failed to toggle active:", error);
    }
  }

  async function deleteUser(id: string) {
    try {
      const response = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  }

  const filtered = users.filter(user => {
    if (filter === "premium" && !user.isPremium) return false;
    if (filter === "free" && user.isPremium) return false;
    if (filter === "active" && !user.active) return false;
    if (filter === "inactive" && user.active) return false;
    if (search && !user.name.toLowerCase().includes(search.toLowerCase()) && !user.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.isPremium).length;
  const activeUsers = users.filter(u => u.active).length;

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CardTitle className="text-2xl mb-6">Users Management</CardTitle>
          <p className="text-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <CardTitle className="text-2xl">Users Management</CardTitle>
            <p className="text-muted text-sm mt-1">Manage all registered users</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue/10 flex items-center justify-center">
                <UserX className="h-5 w-5 text-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-yellow" />
              </div>
              <div>
                <p className="text-2xl font-bold">{premiumUsers}</p>
                <p className="text-xs text-muted">Premium Members</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-green" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeUsers}</p>
                <p className="text-xs text-muted">Active Users</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl bg-muted-bg border border-white/10 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "premium", "free", "active", "inactive"] as const).map(f => (
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

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-muted-bg/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted">Role</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted">Premium</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted">Joined</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        {user.phone && <p className="text-muted">{user.phone}</p>}
                        {user.country && <p className="text-muted">{user.country}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "admin" ? "premium" : "blue"} className="text-xs">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(user.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.active
                            ? "bg-green/10 text-green hover:bg-green/20"
                            : "bg-red/10 text-red hover:bg-red/20"
                        }`}
                      >
                        {user.active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {user.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePremium(user.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isPremium
                            ? "bg-yellow/10 text-yellow hover:bg-yellow/20"
                            : "bg-muted-bg text-muted hover:bg-white/10"
                        }`}
                      >
                        <Crown className="h-3 w-3" />
                        {user.isPremium ? "Premium" : "Free"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditModal({ open: true, user })}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="p-1.5 rounded-lg hover:bg-red/10 text-muted hover:text-red transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted">
              No users found
            </div>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Delete User</h3>
              <p className="text-muted text-sm mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button variant="primary" className="bg-red hover:bg-red/90" onClick={() => deleteUser(deleteConfirm)}>
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
