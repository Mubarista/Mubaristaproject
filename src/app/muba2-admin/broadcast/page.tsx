"use client";

import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BroadcastPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "subscribers" | "verified">("all");
  const [ctaUrl, setCtaUrl] = useState("https://mubarista.com");
  const [ctaText, setCtaText] = useState("Visit MUBARISTA");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, audience, ctaUrl, ctaText }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Broadcast sent to ${data.sent} of ${data.total} recipients`);
        setSubject("");
        setMessage("");
      } else {
        setError(data.error || "Failed to send broadcast");
      }
    } catch (err) {
      setError("Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Megaphone className="h-8 w-8" /> Broadcast
          </h1>
          <p className="text-muted">Send announcements, competition updates, or winner notifications to registered users.</p>
        </div>

        <Card className="p-6">
          <CardTitle className="mb-6">New Broadcast</CardTitle>

          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-sm text-muted mb-1">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              >
                <option value="all">All registered users (mandatory: new competitions, winners, upcoming)</option>
                <option value="verified">All verified emails</option>
                <option value="subscribers">Subscribed users only (events, articles, coffee history)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="e.g. New competition now open!"
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue resize-none"
                placeholder="Write the announcement here..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">CTA URL</label>
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">CTA Text</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>
            </div>

            {result && (
              <div className="p-3 rounded-lg bg-green/10 text-green text-sm">{result}</div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-red/10 text-red text-sm">{error}</div>
            )}

            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? "Sending..." : <><Send className="h-4 w-4 mr-2" /> Send Broadcast</>}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
