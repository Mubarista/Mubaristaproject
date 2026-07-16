"use client";

import { useState, useEffect } from "react";
import { AdminModal, Field, Textarea } from "@/components/admin/admin-modal";
import { LoadingDots } from "@/components/ui/loading-dots";

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ 
    footerDescription: "", 
    privacyContent: "",
    instagram: "", 
    facebook: "", 
    youtube: "", 
    twitter: "", 
    tiktok: "", 
    whatsapp: "",
    shippingInfo1Title: "",
    shippingInfo1Description: "",
    shippingInfo2Title: "",
    shippingInfo2Description: "",
    shippingInfo3Title: "",
    shippingInfo3Description: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/site-settings");
      const data = await res.json();
      setSettings(data || {});
      setDraft({ 
        footerDescription: data?.footerDescription || "",
        privacyContent: data?.privacyContent || "",
        instagram: data?.instagram || "",
        facebook: data?.facebook || "",
        youtube: data?.youtube || "",
        twitter: data?.twitter || "",
        tiktok: data?.tiktok || "",
        whatsapp: data?.whatsapp || "",
        shippingInfo1Title: data?.shippingInfo1Title || "",
        shippingInfo1Description: data?.shippingInfo1Description || "",
        shippingInfo2Title: data?.shippingInfo2Title || "",
        shippingInfo2Description: data?.shippingInfo2Description || "",
        shippingInfo3Title: data?.shippingInfo3Title || "",
        shippingInfo3Description: data?.shippingInfo3Description || ""
      });
    } catch (error) {
      console.error("Error fetching site settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await fetchSettings();
        setEditing(false);
      }
    } catch (error) {
      console.error("Error saving site settings:", error);
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
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <p className="text-muted text-sm">Manage global site settings and content.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Footer Description</h3>
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 rounded-xl bg-blue text-white text-sm hover:bg-blue/90 transition-colors"
          >
            Edit
          </button>
        </div>
        <p className="text-muted text-sm">{settings.footerDescription}</p>

        <div className="border-t border-white/10 pt-6">
          <h3 className="font-semibold mb-4">Privacy Policy Content</h3>
          <p className="text-sm text-muted line-clamp-4">{settings.privacyContent || "Not set"}</p>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="font-semibold mb-4">Social Media Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Instagram</label>
              <p className="text-sm">{settings.instagram || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Facebook</label>
              <p className="text-sm">{settings.facebook || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">YouTube</label>
              <p className="text-sm">{settings.youtube || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Twitter</label>
              <p className="text-sm">{settings.twitter || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">TikTok</label>
              <p className="text-sm">{settings.tiktok || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">WhatsApp</label>
              <p className="text-sm">{settings.whatsapp || "Not set"}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="font-semibold mb-4">Product Shipping Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Info 1 Title</label>
              <p className="text-sm font-medium">{settings.shippingInfo1Title || "Not set"}</p>
              <label className="text-xs text-muted mb-1 block mt-2">Info 1 Description</label>
              <p className="text-sm">{settings.shippingInfo1Description || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Info 2 Title</label>
              <p className="text-sm font-medium">{settings.shippingInfo2Title || "Not set"}</p>
              <label className="text-xs text-muted mb-1 block mt-2">Info 2 Description</label>
              <p className="text-sm">{settings.shippingInfo2Description || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Info 3 Title</label>
              <p className="text-sm font-medium">{settings.shippingInfo3Title || "Not set"}</p>
              <label className="text-xs text-muted mb-1 block mt-2">Info 3 Description</label>
              <p className="text-sm">{settings.shippingInfo3Description || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <AdminModal
          title="Edit Site Settings"
          onClose={() => setEditing(false)}
          onSave={save}
        >
          <Field label="Footer Description" required>
            <Textarea
              value={draft.footerDescription}
              onChange={(e) => setDraft({ ...draft, footerDescription: e.target.value })}
              rows={4}
            />
          </Field>

          <Field label="Privacy Policy Content">
            <Textarea
              value={draft.privacyContent}
              onChange={(e) => setDraft({ ...draft, privacyContent: e.target.value })}
              rows={10}
            />
          </Field>
          
          <div className="border-t border-white/10 pt-4 mt-4">
            <h4 className="font-semibold mb-4">Social Media Links</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Instagram URL</label>
                <input
                  type="text"
                  value={draft.instagram}
                  onChange={(e) => setDraft({ ...draft, instagram: e.target.value })}
                  placeholder="https://instagram.com/mubarista"
                  className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Facebook URL</label>
                <input
                  type="text"
                  value={draft.facebook}
                  onChange={(e) => setDraft({ ...draft, facebook: e.target.value })}
                  placeholder="https://facebook.com/mubarista"
                  className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">YouTube URL</label>
                <input
                  type="text"
                  value={draft.youtube}
                  onChange={(e) => setDraft({ ...draft, youtube: e.target.value })}
                  placeholder="https://youtube.com/@mubarista"
                  className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Twitter URL</label>
                <input
                  type="text"
                  value={draft.twitter}
                  onChange={(e) => setDraft({ ...draft, twitter: e.target.value })}
                  placeholder="https://twitter.com/mubarista"
                  className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">TikTok URL</label>
                <input
                  type="text"
                  value={draft.tiktok}
                  onChange={(e) => setDraft({ ...draft, tiktok: e.target.value })}
                  placeholder="https://tiktok.com/@mubarista"
                  className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">WhatsApp URL</label>
                <input
                  type="text"
                  value={draft.whatsapp}
                  onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
                  placeholder="https://wa.me/250788123456"
                  className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <h4 className="font-semibold mb-4">Product Shipping Info</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted mb-1 block">Info 1 Title</label>
                  <input
                    type="text"
                    value={draft.shippingInfo1Title}
                    onChange={(e) => setDraft({ ...draft, shippingInfo1Title: e.target.value })}
                    placeholder="Free Shipping"
                    className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Info 1 Description</label>
                  <input
                    type="text"
                    value={draft.shippingInfo1Description}
                    onChange={(e) => setDraft({ ...draft, shippingInfo1Description: e.target.value })}
                    placeholder="On orders over $100"
                    className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted mb-1 block">Info 2 Title</label>
                  <input
                    type="text"
                    value={draft.shippingInfo2Title}
                    onChange={(e) => setDraft({ ...draft, shippingInfo2Title: e.target.value })}
                    placeholder="2 Year Warranty"
                    className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Info 2 Description</label>
                  <input
                    type="text"
                    value={draft.shippingInfo2Description}
                    onChange={(e) => setDraft({ ...draft, shippingInfo2Description: e.target.value })}
                    placeholder="Full coverage"
                    className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted mb-1 block">Info 3 Title</label>
                  <input
                    type="text"
                    value={draft.shippingInfo3Title}
                    onChange={(e) => setDraft({ ...draft, shippingInfo3Title: e.target.value })}
                    placeholder="30 Day Returns"
                    className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Info 3 Description</label>
                  <input
                    type="text"
                    value={draft.shippingInfo3Description}
                    onChange={(e) => setDraft({ ...draft, shippingInfo3Description: e.target.value })}
                    placeholder="Hassle-free returns"
                    className="w-full rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}