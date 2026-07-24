"use client";

import { useState, useEffect } from "react";
import { User, Lock, Image as ImageIcon, Share2, Settings as SettingsIcon, Eye, EyeOff } from "lucide-react";
import { AdminModal, Field, Input, ImageUpload, Textarea } from "@/components/admin/admin-modal";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAdminAuth } from "@/lib/admin-auth-context";

export default function AdminSettingsPage() {
  const { isAdminAuthed, userId } = useAdminAuth();
  const [user, setUser] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: "", email: "", avatar: "" });
  
  // Password editing
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState({ newPassword: "", confirmPassword: "" });
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  
  // Logo editing
  const [editingLogo, setEditingLogo] = useState(false);
  const [logoDraft, setLogoDraft] = useState("");

  // Social media editing
  const [editingSocial, setEditingSocial] = useState(false);
  const [socialDraft, setSocialDraft] = useState({ instagram: "", facebook: "", youtube: "", twitter: "", tiktok: "", whatsapp: "" });

  // Admin portal editing
  const [editingAdminPortal, setEditingAdminPortal] = useState(false);
  const [adminPortalDraft, setAdminPortalDraft] = useState({ title: "", subtitle: "" });

  // CTA background editing
  const [editingCtaBackground, setEditingCtaBackground] = useState(false);
  const [ctaBackgroundDraft, setCtaBackgroundDraft] = useState("");

  // CTA text editing
  const [editingCtaText, setEditingCtaText] = useState(false);
  const [ctaTextDraft, setCtaTextDraft] = useState({
    badgeText: "",
    title: "",
    description: "",
    primaryButtonText: "",
    secondaryButtonText: "",
  });

  // Learn section editing
  const [editingLearnText, setEditingLearnText] = useState(false);
  const [learnTextDraft, setLearnTextDraft] = useState({
    badgeText: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
    fetchSiteSettings();
  }, [userId]);

  async function fetchUser() {
    if (!userId) return;
    try {
      const res = await fetch(`/api/user?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setUser(data);
          setProfileDraft({ name: data.name || "", email: data.email || "", avatar: data.avatar || "" });
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSiteSettings() {
    try {
      const res = await fetch("/api/site-settings");
      if (res.ok) {
        const data = await res.json();
        setSiteSettings(data);
        setLogoDraft(data.logo || "");
        setSocialDraft({
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          youtube: data.youtube || "",
          twitter: data.twitter || "",
          tiktok: data.tiktok || "",
          whatsapp: data.whatsapp || "",
        });
        setAdminPortalDraft({
          title: data.adminPortalTitle || "Admin Portal",
          subtitle: data.adminPortalSubtitle || "Full CMS Control",
        });
        setCtaBackgroundDraft(data.ctaBackgroundImage || "");
        setCtaTextDraft({
          badgeText: data.ctaBadgeText || "Registrations now open for 2026 Season",
          title: data.ctaTitle || "Ready to Compete With the World's Best Baristas?",
          description: data.ctaDescription || "Join 48,500+ baristas from 127 countries. Enter competitions, win prizes, build your career, and become a global name in coffee.",
          primaryButtonText: data.ctaPrimaryButtonText || "Join Free Today",
          secondaryButtonText: data.ctaSecondaryButtonText || "View Live Competitions",
        });
        setLearnTextDraft({
          badgeText: data.learnBadgeText || "Education",
          title: data.learnTitle || "Learning Center",
          description: data.learnDescription || "Free educational content for baristas at every level. Upgrade for premium courses and certifications.",
        });
      }
    } catch (error) {
      console.error("Error fetching site settings:", error);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, ...profileDraft }),
      });
      if (res.ok) {
        await fetchUser();
        setEditingProfile(false);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setPasswordError("");
    setPasswordSuccess("");
    
    if (!passwordDraft.newPassword) {
      setPasswordError("New password is required");
      return;
    }
    
    if (passwordDraft.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    
    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    setSaving(true);
    try {
      // Use admin endpoint to update password (doesn't require session validation)
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          newPassword: passwordDraft.newPassword,
        }),
      });
      if (res.ok) {
        setPasswordDraft({ newPassword: "", confirmPassword: "" });
        setPasswordSuccess("Password updated successfully!");
        setTimeout(() => {
          setEditingPassword(false);
          setPasswordSuccess("");
        }, 2000);
      } else {
        const data = await res.json();
        setPasswordError(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Error saving password:", error);
      setPasswordError("An error occurred while updating password");
    } finally {
      setSaving(false);
    }
  }

  async function saveLogo() {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footerDescription: siteSettings?.footerDescription || "",
          logo: logoDraft,
          instagram: socialDraft.instagram,
          facebook: socialDraft.facebook,
          youtube: socialDraft.youtube,
          twitter: socialDraft.twitter,
          tiktok: socialDraft.tiktok,
          whatsapp: socialDraft.whatsapp,
        }),
      });
      if (res.ok) {
        await fetchSiteSettings();
        setEditingLogo(false);
      }
    } catch (error) {
      console.error("Error saving logo:", error);
    } finally {
      setSaving(false);
    }
  }

  async function saveSocial() {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footerDescription: siteSettings?.footerDescription || "",
          logo: logoDraft,
          instagram: socialDraft.instagram,
          facebook: socialDraft.facebook,
          youtube: socialDraft.youtube,
          twitter: socialDraft.twitter,
          tiktok: socialDraft.tiktok,
          whatsapp: socialDraft.whatsapp,
          adminPortalTitle: adminPortalDraft.title,
          adminPortalSubtitle: adminPortalDraft.subtitle,
        }),
      });
      if (res.ok) {
        await fetchSiteSettings();
        setEditingSocial(false);
      }
    } catch (error) {
      console.error("Error saving social media:", error);
    } finally {
      setSaving(false);
    }
  }

  async function saveAdminPortal() {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footerDescription: siteSettings?.footerDescription || "",
          logo: logoDraft,
          instagram: socialDraft.instagram,
          facebook: socialDraft.facebook,
          youtube: socialDraft.youtube,
          twitter: socialDraft.twitter,
          tiktok: socialDraft.tiktok,
          whatsapp: socialDraft.whatsapp,
          adminPortalTitle: adminPortalDraft.title,
          adminPortalSubtitle: adminPortalDraft.subtitle,
          ctaBackgroundImage: ctaBackgroundDraft,
        }),
      });
      if (res.ok) {
        await fetchSiteSettings();
        setEditingAdminPortal(false);
      }
    } catch (error) {
      console.error("Error saving admin portal settings:", error);
    } finally {
      setSaving(false);
    }
  }

  async function saveCtaBackground() {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footerDescription: siteSettings?.footerDescription || "",
          logo: logoDraft,
          instagram: socialDraft.instagram,
          facebook: socialDraft.facebook,
          youtube: socialDraft.youtube,
          twitter: socialDraft.twitter,
          tiktok: socialDraft.tiktok,
          whatsapp: socialDraft.whatsapp,
          adminPortalTitle: adminPortalDraft.title,
          adminPortalSubtitle: adminPortalDraft.subtitle,
          ctaBackgroundImage: ctaBackgroundDraft,
          ctaBadgeText: ctaTextDraft.badgeText,
          ctaTitle: ctaTextDraft.title,
          ctaDescription: ctaTextDraft.description,
          ctaPrimaryButtonText: ctaTextDraft.primaryButtonText,
          ctaSecondaryButtonText: ctaTextDraft.secondaryButtonText,
        }),
      });
      if (res.ok) {
        await fetchSiteSettings();
        setEditingCtaBackground(false);
      }
    } catch (error) {
      console.error("Error saving CTA background:", error);
    } finally {
      setSaving(false);
    }
  }

  async function saveCtaText() {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footerDescription: siteSettings?.footerDescription || "",
          logo: logoDraft,
          instagram: socialDraft.instagram,
          facebook: socialDraft.facebook,
          youtube: socialDraft.youtube,
          twitter: socialDraft.twitter,
          tiktok: socialDraft.tiktok,
          whatsapp: socialDraft.whatsapp,
          adminPortalTitle: adminPortalDraft.title,
          adminPortalSubtitle: adminPortalDraft.subtitle,
          ctaBackgroundImage: ctaBackgroundDraft,
          ctaBadgeText: ctaTextDraft.badgeText,
          ctaTitle: ctaTextDraft.title,
          ctaDescription: ctaTextDraft.description,
          ctaPrimaryButtonText: ctaTextDraft.primaryButtonText,
          ctaSecondaryButtonText: ctaTextDraft.secondaryButtonText,
        }),
      });
      if (res.ok) {
        await fetchSiteSettings();
        setEditingCtaText(false);
      }
    } catch (error) {
      console.error("Error saving CTA text:", error);
    } finally {
      setSaving(false);
    }
  }

  async function saveLearnText() {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footerDescription: siteSettings?.footerDescription || "",
          logo: logoDraft,
          instagram: socialDraft.instagram,
          facebook: socialDraft.facebook,
          youtube: socialDraft.youtube,
          twitter: socialDraft.twitter,
          tiktok: socialDraft.tiktok,
          whatsapp: socialDraft.whatsapp,
          adminPortalTitle: adminPortalDraft.title,
          adminPortalSubtitle: adminPortalDraft.subtitle,
          ctaBackgroundImage: ctaBackgroundDraft,
          ctaBadgeText: ctaTextDraft.badgeText,
          ctaTitle: ctaTextDraft.title,
          ctaDescription: ctaTextDraft.description,
          ctaPrimaryButtonText: ctaTextDraft.primaryButtonText,
          ctaSecondaryButtonText: ctaTextDraft.secondaryButtonText,
          learnBadgeText: learnTextDraft.badgeText,
          learnTitle: learnTextDraft.title,
          learnDescription: learnTextDraft.description,
        }),
      });
      if (res.ok) {
        await fetchSiteSettings();
        setEditingLearnText(false);
      }
    } catch (error) {
      console.error("Error saving learn text:", error);
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
        <h1 className="text-2xl font-bold">MubaristaHub Settings</h1>
        <p className="text-muted text-sm">Manage your account and site settings.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue" />
              <h3 className="font-semibold">Profile Settings</h3>
            </div>
            <button
              onClick={() => setEditingProfile(true)}
              className="px-4 py-2 rounded-xl bg-blue text-white text-sm hover:bg-blue/90 transition-colors"
            >
              Edit Profile
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-muted-bg">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || "Admin"} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{user?.name || "Admin"}</p>
                <p className="text-sm text-muted">{user?.email || ""}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue" />
              <h3 className="font-semibold">Password</h3>
            </div>
            <button
              onClick={() => setEditingPassword(true)}
              className="px-4 py-2 rounded-xl bg-blue text-white text-sm hover:bg-blue/90 transition-colors"
            >
              Change Password
            </button>
          </div>
          <p className="text-sm text-muted">Change your login password</p>
        </div>

        {/* Logo Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-blue" />
              <h3 className="font-semibold">App Logo</h3>
            </div>
            <button
              onClick={() => setEditingLogo(true)}
              className="px-4 py-2 rounded-xl bg-blue text-white text-sm hover:bg-blue/90 transition-colors"
            >
              Change Logo
            </button>
          </div>
          <div className="flex items-center gap-4">
            {siteSettings?.logo ? (
              <img src={siteSettings.logo} alt="Logo" className="h-12 w-auto" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted-bg flex items-center justify-center text-muted">
                No logo
              </div>
            )}
            <p className="text-sm text-muted">Current app logo</p>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-blue" />
              <h3 className="font-semibold">Social Media Links</h3>
            </div>
            <button
              onClick={() => setEditingSocial(true)}
              className="px-4 py-2 rounded-xl bg-blue text-white text-sm hover:bg-blue/90 transition-colors"
            >
              Edit Social Media
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {socialDraft.instagram && (
              <div className="text-sm">
                <span className="text-muted">Instagram:</span>
                <span className="ml-2">{socialDraft.instagram}</span>
              </div>
            )}
            {socialDraft.facebook && (
              <div className="text-sm">
                <span className="text-muted">Facebook:</span>
                <span className="ml-2">{socialDraft.facebook}</span>
              </div>
            )}
            {socialDraft.youtube && (
              <div className="text-sm">
                <span className="text-muted">YouTube:</span>
                <span className="ml-2">{socialDraft.youtube}</span>
              </div>
            )}
            {socialDraft.twitter && (
              <div className="text-sm">
                <span className="text-muted">Twitter:</span>
                <span className="ml-2">{socialDraft.twitter}</span>
              </div>
            )}
            {socialDraft.tiktok && (
              <div className="text-sm">
                <span className="text-muted">TikTok:</span>
                <span className="ml-2">{socialDraft.tiktok}</span>
              </div>
            )}
            {socialDraft.whatsapp && (
              <div className="text-sm">
                <span className="text-muted">WhatsApp:</span>
                <span className="ml-2">{socialDraft.whatsapp}</span>
              </div>
            )}
            {!socialDraft.instagram && !socialDraft.facebook && !socialDraft.youtube && !socialDraft.twitter && !socialDraft.tiktok && !socialDraft.whatsapp && (
              <p className="text-sm text-muted col-span-full">No social media links configured</p>
            )}
          </div>
        </div>

        {/* Admin Portal Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-5 w-5 text-blue" />
              <h3 className="font-semibold">Admin Portal Settings</h3>
            </div>
            <button
              onClick={() => setEditingAdminPortal(true)}
              className="px-4 py-2 rounded-xl bg-blue text-white text-sm hover:bg-blue/90 transition-colors"
            >
              Edit Admin Portal
            </button>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted">Title:</span>
              <span className="ml-2 font-medium">{adminPortalDraft.title}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted">Subtitle:</span>
              <span className="ml-2 font-medium">{adminPortalDraft.subtitle}</span>
            </div>
          </div>
        </div>

        {/* CTA Background Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-blue" />
              <h3 className="font-semibold">CTA Section Background</h3>
            </div>
            <button
              onClick={() => setEditingCtaBackground(true)}
              className="px-4 py-2 rounded-xl bg-blue text-white text-sm hover:bg-blue/90 transition-colors"
            >
              Change Background
            </button>
          </div>
          <div className="flex items-center gap-4">
            {ctaBackgroundDraft ? (
              <img src={ctaBackgroundDraft} alt="CTA Background" className="h-20 w-32 object-cover rounded-lg" />
            ) : (
              <div className="h-20 w-32 rounded-lg bg-muted-bg flex items-center justify-center text-muted text-xs">
                No background
              </div>
            )}
            <p className="text-sm text-muted">Background image for the CTA section on homepage</p>
          </div>
        </div>

        {/* CTA Text Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-5 w-5 text-blue" />
              <h3 className="font-semibold">CTA Section Text</h3>
            </div>
            <button
              onClick={() => setEditingCtaText(true)}
              className="px-4 py-2 rounded-xl bg-blue text-white text-sm hover:bg-blue/90 transition-colors"
            >
              Edit Text
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted">Badge:</span>
              <span className="ml-2">{ctaTextDraft.badgeText}</span>
            </div>
            <div>
              <span className="text-muted">Title:</span>
              <span className="ml-2">{ctaTextDraft.title}</span>
            </div>
            <div>
              <span className="text-muted">Description:</span>
              <span className="ml-2 line-clamp-2">{ctaTextDraft.description}</span>
            </div>
            <div>
              <span className="text-muted">Primary Button:</span>
              <span className="ml-2">{ctaTextDraft.primaryButtonText}</span>
            </div>
            <div>
              <span className="text-muted">Secondary Button:</span>
              <span className="ml-2">{ctaTextDraft.secondaryButtonText}</span>
            </div>
          </div>
        </div>

        {/* Learn Section Text */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-5 w-5 text-blue" />
              <h3 className="font-semibold">Learn Section Text</h3>
            </div>
            <button
              onClick={() => setEditingLearnText(true)}
              className="px-4 py-2 rounded-xl bg-blue text-white text-sm hover:bg-blue/90 transition-colors"
            >
              Edit Text
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted">Badge:</span>
              <span className="ml-2">{learnTextDraft.badgeText}</span>
            </div>
            <div>
              <span className="text-muted">Title:</span>
              <span className="ml-2">{learnTextDraft.title}</span>
            </div>
            <div>
              <span className="text-muted">Description:</span>
              <span className="ml-2 line-clamp-2">{learnTextDraft.description}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {editingProfile && (
        <AdminModal
          title="Edit Profile"
          onClose={() => setEditingProfile(false)}
          onSave={saveProfile}
        >
          <Field label="Display Name" required>
            <Input
              value={profileDraft.name}
              onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
            />
          </Field>
          <Field label="Email" required>
            <Input
              value={profileDraft.email}
              onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
              type="email"
            />
          </Field>
          <Field label="Profile Photo">
            <ImageUpload
              value={profileDraft.avatar}
              onChange={(url) => setProfileDraft({ ...profileDraft, avatar: url })}
              aspectRatio="square"
            />
          </Field>
        </AdminModal>
      )}

      {/* Password Edit Modal */}
      {editingPassword && (
        <AdminModal
          title="Change Password"
          onClose={() => {
            setEditingPassword(false);
            setPasswordError("");
            setPasswordSuccess("");
          }}
          onSave={savePassword}
        >
          {passwordError && (
            <div className="mb-4 p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green/10 border border-green/20 text-green text-sm">
              {passwordSuccess}
            </div>
          )}
          <p className="text-sm text-muted mb-4">
            As an authenticated admin, you can set a new password without entering your current password.
          </p>
          <Field label="New Password" required>
            <div className="relative">
              <Input
                value={passwordDraft.newPassword}
                onChange={(e) => {
                  setPasswordDraft({ ...passwordDraft, newPassword: e.target.value });
                  setPasswordError("");
                }}
                type={showPasswords.new ? "text" : "password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm New Password" required>
            <div className="relative">
              <Input
                value={passwordDraft.confirmPassword}
                onChange={(e) => {
                  setPasswordDraft({ ...passwordDraft, confirmPassword: e.target.value });
                  setPasswordError("");
                }}
                type={showPasswords.confirm ? "text" : "password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        </AdminModal>
      )}

      {/* Logo Edit Modal */}
      {editingLogo && (
        <AdminModal
          title="Change App Logo"
          onClose={() => setEditingLogo(false)}
          onSave={saveLogo}
        >
          <Field label="Logo Image (PNG with transparent background)">
            <ImageUpload
              value={logoDraft}
              onChange={setLogoDraft}
              aspectRatio="square"
              pngOnly
            />
          </Field>
        </AdminModal>
      )}

      {/* Social Media Edit Modal */}
      {editingSocial && (
        <AdminModal
          title="Edit Social Media Links"
          onClose={() => setEditingSocial(false)}
          onSave={saveSocial}
        >
          <Field label="Instagram URL">
            <Input
              value={socialDraft.instagram}
              onChange={(e) => setSocialDraft({ ...socialDraft, instagram: e.target.value })}
              placeholder="https://instagram.com/yourusername"
            />
          </Field>
          <Field label="Facebook URL">
            <Input
              value={socialDraft.facebook}
              onChange={(e) => setSocialDraft({ ...socialDraft, facebook: e.target.value })}
              placeholder="https://facebook.com/yourpage"
            />
          </Field>
          <Field label="YouTube URL">
            <Input
              value={socialDraft.youtube}
              onChange={(e) => setSocialDraft({ ...socialDraft, youtube: e.target.value })}
              placeholder="https://youtube.com/yourchannel"
            />
          </Field>
          <Field label="Twitter (X) URL">
            <Input
              value={socialDraft.twitter}
              onChange={(e) => setSocialDraft({ ...socialDraft, twitter: e.target.value })}
              placeholder="https://twitter.com/yourusername"
            />
          </Field>
          <Field label="TikTok URL">
            <Input
              value={socialDraft.tiktok}
              onChange={(e) => setSocialDraft({ ...socialDraft, tiktok: e.target.value })}
              placeholder="https://tiktok.com/@yourusername"
            />
          </Field>
          <Field label="WhatsApp URL">
            <Input
              value={socialDraft.whatsapp}
              onChange={(e) => setSocialDraft({ ...socialDraft, whatsapp: e.target.value })}
              placeholder="https://wa.me/250xxxxxxxxx"
            />
          </Field>
        </AdminModal>
      )}

      {/* Admin Portal Edit Modal */}
      {editingAdminPortal && (
        <AdminModal
          title="Edit Admin Portal Settings"
          onClose={() => setEditingAdminPortal(false)}
          onSave={saveAdminPortal}
        >
          <Field label="Portal Title" required>
            <Input
              value={adminPortalDraft.title}
              onChange={(e) => setAdminPortalDraft({ ...adminPortalDraft, title: e.target.value })}
              placeholder="Admin Portal"
            />
          </Field>
          <Field label="Portal Subtitle" required>
            <Input
              value={adminPortalDraft.subtitle}
              onChange={(e) => setAdminPortalDraft({ ...adminPortalDraft, subtitle: e.target.value })}
              placeholder="Full CMS Control"
            />
          </Field>
        </AdminModal>
      )}

      {/* CTA Background Edit Modal */}
      {editingCtaBackground && (
        <AdminModal
          title="Change CTA Background"
          onClose={() => setEditingCtaBackground(false)}
          onSave={saveCtaBackground}
        >
          <Field label="Background Image">
            <ImageUpload
              value={ctaBackgroundDraft}
              onChange={setCtaBackgroundDraft}
              aspectRatio="banner"
              allowCrop
            />
          </Field>
        </AdminModal>
      )}

      {/* CTA Text Edit Modal */}
      {editingCtaText && (
        <AdminModal
          title="Edit CTA Section Text"
          onClose={() => setEditingCtaText(false)}
          onSave={saveCtaText}
        >
          <Field label="Badge Text">
            <Input
              value={ctaTextDraft.badgeText}
              onChange={(e) => setCtaTextDraft({ ...ctaTextDraft, badgeText: e.target.value })}
              placeholder="Registrations now open for 2026 Season"
            />
          </Field>
          <Field label="Title">
            <Input
              value={ctaTextDraft.title}
              onChange={(e) => setCtaTextDraft({ ...ctaTextDraft, title: e.target.value })}
              placeholder="Ready to Compete With the World's Best Baristas?"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={ctaTextDraft.description}
              onChange={(e) => setCtaTextDraft({ ...ctaTextDraft, description: e.target.value })}
              placeholder="Join 48,500+ baristas from 127 countries. Enter competitions, win prizes, build your career, and become a global name in coffee."
            />
          </Field>
          <Field label="Primary Button Text">
            <Input
              value={ctaTextDraft.primaryButtonText}
              onChange={(e) => setCtaTextDraft({ ...ctaTextDraft, primaryButtonText: e.target.value })}
              placeholder="Join Free Today"
            />
          </Field>
          <Field label="Secondary Button Text">
            <Input
              value={ctaTextDraft.secondaryButtonText}
              onChange={(e) => setCtaTextDraft({ ...ctaTextDraft, secondaryButtonText: e.target.value })}
              placeholder="View Live Competitions"
            />
          </Field>
        </AdminModal>
      )}

      {/* Learn Section Text Edit Modal */}
      {editingLearnText && (
        <AdminModal
          title="Edit Learn Section Text"
          onClose={() => setEditingLearnText(false)}
          onSave={saveLearnText}
        >
          <Field label="Badge Text">
            <Input
              value={learnTextDraft.badgeText}
              onChange={(e) => setLearnTextDraft({ ...learnTextDraft, badgeText: e.target.value })}
              placeholder="Education"
            />
          </Field>
          <Field label="Title">
            <Input
              value={learnTextDraft.title}
              onChange={(e) => setLearnTextDraft({ ...learnTextDraft, title: e.target.value })}
              placeholder="Learning Center"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={learnTextDraft.description}
              onChange={(e) => setLearnTextDraft({ ...learnTextDraft, description: e.target.value })}
              placeholder="Free educational content for baristas at every level. Upgrade for premium courses and certifications."
            />
          </Field>
        </AdminModal>
      )}
    </div>
  );
}
