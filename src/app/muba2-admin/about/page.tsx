"use client";

import { useState, useEffect } from "react";
import { AdminModal, Field, Input, Textarea, ImageUpload } from "@/components/admin/admin-modal";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface AboutContent {
  id: string;
  title: string;
  description: string;
  mission: string;
  vision: string;
  imageUrl: string;
  values: any[];
  features: any[];
  platformRoles: string[];
  platformRolesDescription: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAboutPage() {
  const [about, setAbout] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    mission: "",
    vision: "",
    imageUrl: "",
    values: [] as any[],
    features: [] as any[],
    platformRoles: [] as string[],
    platformRolesDescription: ""
  });

  useEffect(() => {
    fetchAbout();
  }, []);

  async function fetchAbout() {
    try {
      const res = await fetch("/api/about");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setAbout(data);
          setDraft({
            title: data.title,
            description: data.description,
            mission: data.mission || "",
            vision: data.vision || "",
            imageUrl: data.imageUrl,
            values: Array.isArray(data.values) ? data.values : [],
            features: Array.isArray(data.features) ? data.features : [],
            platformRoles: data.platformRoles || [],
            platformRolesDescription: data.platformRolesDescription || ""
          });
        }
      }
    } catch (error) {
      console.error("Error fetching about content:", error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const method = about ? "PUT" : "PUT";
      const body = about ? { ...draft, id: about.id } : draft;
      
      const res = await fetch("/api/about", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchAbout();
      }
    } catch (error) {
      console.error("Error saving about content:", error);
    } finally {
      setSaving(false);
    }
  }

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
        <h1 className="text-2xl font-bold">About Page</h1>
        <p className="text-muted text-sm">Manage the About page content.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-6">
        <Field label="Page Title" required>
          <Input
            value={draft.title}
            onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
            placeholder="Enter page title"
          />
        </Field>

        <Field label="Description" required>
          <Textarea
            rows={4}
            value={draft.description}
            onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
            placeholder="Building the world's leading platform for barista excellence."
          />
        </Field>

        <Field label="Mission">
          <Textarea
            rows={3}
            value={draft.mission}
            onChange={(e) => setDraft(d => ({ ...d, mission: e.target.value }))}
            placeholder="Our mission is to elevate coffee culture worldwide..."
          />
        </Field>

        <Field label="Vision">
          <Textarea
            rows={3}
            value={draft.vision}
            onChange={(e) => setDraft(d => ({ ...d, vision: e.target.value }))}
            placeholder="To become the global standard for coffee competitions..."
          />
        </Field>

        <Field label="Hero Image">
          <ImageUpload
            value={draft.imageUrl}
            onChange={(url) => setDraft(d => ({ ...d, imageUrl: url }))}
            aspectRatio="banner"
          />
        </Field>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Our Values</label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDraft(d => ({ ...d, values: [...d.values, { icon: "Trophy", bg: "bg-blue/10", color: "text-blue", title: "", description: "" }] }))}
            >
              Add Value
            </Button>
          </div>
          {draft.values.map((value, index) => (
            <div key={index} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Value {index + 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDraft(d => ({ ...d, values: d.values.filter((_, i) => i !== index) }))}
                >
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Icon</label>
                  <select
                    value={value.icon}
                    onChange={(e) => setDraft(d => ({ ...d, values: d.values.map((v, i) => i === index ? { ...v, icon: e.target.value } : v) }))}
                    className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                  >
                    <option value="Trophy">Trophy</option>
                    <option value="Globe">Globe</option>
                    <option value="BookOpen">BookOpen</option>
                    <option value="Coffee">Coffee</option>
                    <option value="GraduationCap">GraduationCap</option>
                    <option value="Briefcase">Briefcase</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Background Color</label>
                  <select
                    value={value.bg}
                    onChange={(e) => setDraft(d => ({ ...d, values: d.values.map((v, i) => i === index ? { ...v, bg: e.target.value } : v) }))}
                    className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                  >
                    <option value="bg-blue/10">Blue</option>
                    <option value="bg-green/10">Green</option>
                    <option value="bg-yellow/10">Yellow</option>
                    <option value="bg-red/10">Red</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Title</label>
                <Input
                  value={value.title}
                  onChange={(e) => setDraft(d => ({ ...d, values: d.values.map((v, i) => i === index ? { ...v, title: e.target.value } : v) }))}
                  placeholder="Excellence"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Description</label>
                <Textarea
                  rows={2}
                  value={value.description}
                  onChange={(e) => setDraft(d => ({ ...d, values: d.values.map((v, i) => i === index ? { ...v, description: e.target.value } : v) }))}
                  placeholder="Excellence in coffee craftsmanship"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">What We Offer</label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDraft(d => ({ ...d, features: [...d.features, { icon: "Trophy", label: "", desc: "" }] }))}
            >
              Add Feature
            </Button>
          </div>
          {draft.features.map((feature, index) => (
            <div key={index} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Feature {index + 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDraft(d => ({ ...d, features: d.features.filter((_, i) => i !== index) }))}
                >
                  Remove
                </Button>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Icon</label>
                <select
                  value={feature.icon}
                  onChange={(e) => setDraft(d => ({ ...d, features: d.features.map((f, i) => i === index ? { ...f, icon: e.target.value } : f) }))}
                  className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                >
                  <option value="Trophy">Trophy</option>
                  <option value="BookOpen">BookOpen</option>
                  <option value="Coffee">Coffee</option>
                  <option value="GraduationCap">GraduationCap</option>
                  <option value="Briefcase">Briefcase</option>
                  <option value="Globe">Globe</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Label</label>
                <Input
                  value={feature.label}
                  onChange={(e) => setDraft(d => ({ ...d, features: d.features.map((f, i) => i === index ? { ...f, label: e.target.value } : f) }))}
                  placeholder="Global Competitions"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Description</label>
                <Textarea
                  rows={2}
                  value={feature.desc}
                  onChange={(e) => setDraft(d => ({ ...d, features: d.features.map((f, i) => i === index ? { ...f, desc: e.target.value } : f) }))}
                  placeholder="Compete with baristas worldwide"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Platform Roles</label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDraft(d => ({ ...d, platformRoles: [...d.platformRoles, ""] }))}
            >
              Add Role
            </Button>
          </div>
          {draft.platformRoles.map((role, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={role}
                onChange={(e) => setDraft(d => ({ ...d, platformRoles: d.platformRoles.map((r, i) => i === index ? e.target.value : r) }))}
                placeholder="Visitor"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDraft(d => ({ ...d, platformRoles: d.platformRoles.filter((_, i) => i !== index) }))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <Field label="Platform Roles Description">
          <Textarea
            rows={3}
            value={draft.platformRolesDescription}
            onChange={(e) => setDraft(d => ({ ...d, platformRolesDescription: e.target.value }))}
            placeholder="MUBARISTA serves visitors, registered members, competition participants, administrators, and certified judges..."
          />
        </Field>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
