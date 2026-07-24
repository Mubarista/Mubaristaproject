"use client";

import { useState, useEffect } from "react";
import { supabaseAdminAuth } from "@/lib/supabase";
import { useCan } from "@/lib/admin-permissions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Textarea } from "@/components/admin/admin-modal";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  contentType: string;
  contentId: string;
  status: string;
  reviewNotes?: string;
  createdAt: string;
  submittedBy?: { name?: string; email?: string };
  reviewedBy?: { name?: string; email?: string };
  learningContent?: {
    id: string;
    title: string;
    description?: string;
    contentType?: string;
    status?: string;
  };
}

export default function ReviewsPage() {
  const canReview = useCan("learning", "update");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getToken() {
    const { data } = await supabaseAdminAuth.auth.getSession();
    return data.session?.access_token || "";
  }

  async function loadReviews() {
    setLoading(true);
    const token = await getToken();
    try {
      const res = await fetch("/api/content-reviews?status=pending", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setReviews(await res.json());
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const token = await getToken();
    try {
      const res = await fetch("/api/content-reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status, reviewNotes: notes[id] || "" }),
      });
      if (res.ok) {
        await loadReviews();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update review");
      }
    } catch (error) {
    }
  }

  if (!canReview) {
    return (
      <div className="pt-24 pb-16 px-4">
        <Card className="max-w-xl mx-auto p-8 text-center">
          <CardTitle>Access Denied</CardTitle>
          <p className="text-muted mt-2">You do not have permission to review content.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Content Review Queue</h1>
          <p className="text-muted text-sm">Approve or reject pending submissions from team members.</p>
        </div>

        {loading ? (
          <div className="py-12 text-center"><LoadingDots /></div>
        ) : reviews.length === 0 ? (
          <Card className="p-8 text-center text-muted">No pending reviews.</Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <Card key={r.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{r.learningContent?.title || "Untitled"}</CardTitle>
                      <Badge variant="yellow">{r.contentType}</Badge>
                    </div>
                    <CardDescription className="text-sm">
                      Submitted by {r.submittedBy?.name || r.submittedBy?.email || "Unknown"} on {new Date(r.createdAt).toLocaleString()}
                    </CardDescription>
                    {r.learningContent?.description && (
                      <p className="text-muted text-sm mt-2 line-clamp-2">{r.learningContent.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs text-muted block mb-1.5">Review notes</label>
                  <Textarea
                    value={notes[r.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                    placeholder="Add feedback for the submitter..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button variant="secondary" onClick={() => updateStatus(r.id, "rejected")}>Reject</Button>
                  <Button variant="primary" onClick={() => updateStatus(r.id, "approved")}>Approve & Publish</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
