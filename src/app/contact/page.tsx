"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "support",
    priority: "normal",
    message: ""
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        userId: undefined
      };
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", category: "support", priority: "normal", message: "" });
      }
    } catch (error) {
      console.error("Error submitting message:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Get in Touch"
          title="Contact Us"
          description="Have questions about competitions, membership, or partnerships? We'd love to hear from you."
        />

        <div className="grid grid-cols-1 gap-8">
          <Card>
            {submitted ? (
              <div className="text-center py-12">
                <p className="text-2xl font-semibold text-green mb-2">Message Sent!</p>
                <p className="text-muted">We&apos;ll get back to you within 24 hours.</p>
                <Button
                  variant="ghost"
                  onClick={() => setSubmitted(false)}
                  className="mt-4"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted mb-1 block">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1 block">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
                      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(d => ({ ...d, category: e.target.value }))}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  >
                    <option value="support">Support Request</option>
                    <option value="feedback">Feedback</option>
                    <option value="complaint">Complaint</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(d => ({ ...d, priority: e.target.value }))}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of your inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData(d => ({ ...d, subject: e.target.value }))}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Message</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Please describe your question or feedback in detail"
                    value={formData.message}
                    onChange={(e) => setFormData(d => ({ ...d, message: e.target.value }))}
                    className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue resize-none"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full sm:w-auto" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
