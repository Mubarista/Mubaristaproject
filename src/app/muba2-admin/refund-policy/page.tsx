"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Textarea } from "@/components/admin/admin-modal";

export default function AdminRefundPolicyPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      const res = await fetch("/api/site-settings");
      if (res.ok) {
        const data = await res.json();
        setContent(data?.refundContent || "");
      }
    } catch (error) {
      console.error("Error fetching refund policy:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundContent: content }),
      });
      if (res.ok) {
        setMessage("Refund policy saved successfully.");
      } else {
        setMessage("Failed to save refund policy.");
      }
    } catch (error) {
      console.error("Error saving refund policy:", error);
      setMessage("An error occurred while saving.");
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
        <h1 className="text-2xl font-bold">Refund Policy</h1>
        <p className="text-muted text-sm">Manage the refund policy shown on the public site.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue/10">
            <FileText className="h-4 w-4 text-blue" />
          </div>
          <h3 className="font-semibold">Policy Content</h3>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          placeholder="Enter the refund policy content..."
        />

        {message && (
          <p className={`text-sm ${message.includes("successfully") ? "text-green" : "text-red"}`}>
            {message}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue text-white text-sm font-medium hover:bg-blue/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Refund Policy"}
          </button>
        </div>
      </div>
    </div>
  );
}
