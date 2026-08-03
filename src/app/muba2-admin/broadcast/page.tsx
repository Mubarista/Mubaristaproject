"use client";

import { useState, useEffect } from "react";
import { Megaphone, Send, Repeat, Clock } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Broadcast {
  id: string;
  subject: string;
  message: string;
  audience: "all" | "subscribers" | "verified";
  ctaUrl?: string;
  ctaText?: string;
  sentCount: number;
  total: number;
  createdAt: string;
}

export default function BroadcastPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "subscribers" | "verified">("all");
  const [ctaUrl, setCtaUrl] = useState("https://mubarista.com");
  const [ctaText, setCtaText] = useState("Visit MUBARISTA");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/admin/broadcast");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch broadcast history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }

  function reuse(b: Broadcast) {
    setSubject(b.subject);
    setMessage(b.message);
    setAudience(b.audience);
    setCtaUrl(b.ctaUrl || "https://mubarista.com");
    setCtaText(b.ctaText || "Visit MUBARISTA");
    setResult("Form pre-filled from a previous broadcast. You can edit and send.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
        await fetchHistory();
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

        <Card className="p-6 mb-6">
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

        <Card className="p-6">
          <CardTitle className="mb-6">Broadcast History</CardTitle>
          {historyLoading ? (
            <p className="text-muted text-sm">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-muted text-sm">No broadcasts yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((b) => (
                <div key={b.id} className="p-4 rounded-xl bg-muted-bg/30 border border-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{b.subject}</p>
                      <p className="text-sm text-muted truncate">{b.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                        <span className="capitalize badge px-2 py-0.5 rounded-md bg-blue/10 text-blue">{b.audience}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(b.createdAt).toLocaleString()}</span>
                        <span>Sent {b.sentCount} / {b.total}</span>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => reuse(b)}>
                      <Repeat className="h-4 w-4 mr-2" /> Reuse
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
