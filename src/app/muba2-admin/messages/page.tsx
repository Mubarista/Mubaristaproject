"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { MessageSquare, Trash2, Reply, CheckCircle, Clock, AlertCircle, Filter, Loader2, Search } from "lucide-react";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState<Message | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [search, setSearch] = useState("");

  const filteredMessages = messages.filter((msg) =>
    search === "" ||
    msg.name.toLowerCase().includes(search.toLowerCase()) ||
    msg.email.toLowerCase().includes(search.toLowerCase()) ||
    msg.subject.toLowerCase().includes(search.toLowerCase()) ||
    msg.category.toLowerCase().includes(search.toLowerCase()) ||
    msg.message.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  async function fetchMessages() {
    try {
      const url = filter === "all" ? "/api/messages" : `/api/messages?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  async function deleteMessage(id: string) {
    console.log("deleteMessage called with ID:", id);
    setDeletingId(id);
    // Optimistic update - remove from UI immediately
    setMessages(prev => {
      console.log("Current messages before delete:", prev.length);
      const filtered = prev.filter(m => m.id !== id);
      console.log("Messages after optimistic delete:", filtered.length);
      return filtered;
    });
    if (selectedMessage?.id === id) setSelectedMessage(null);
    
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });
      console.log("DELETE response status:", res.status);
      if (res.ok) {
        // Refetch to ensure UI is in sync with database
        console.log("DELETE successful, refetching messages...");
        await fetchMessages();
      } else {
        // Revert if failed
        console.log("DELETE failed, refetching to revert...");
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      // Revert on error
      await fetchMessages();
    } finally {
      setDeletingId(null);
      setDeleting(null);
    }
  }

  async function deleteAllMessages() {
    setDeletingAll(true);
    // Optimistic update - clear all messages immediately
    setMessages([]);
    setSelectedMessage(null);
    
    try {
      const res = await fetch("/api/messages", {
        method: "DELETE",
      });
      console.log("DELETE ALL response status:", res.status);
      if (res.ok) {
        // Refetch to ensure UI is in sync with database
        console.log("DELETE ALL successful, refetching messages...");
        await fetchMessages();
      } else {
        // Revert if failed
        console.log("DELETE ALL failed, refetching to revert...");
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error deleting all messages:", error);
      // Revert on error
      await fetchMessages();
    } finally {
      setDeletingAll(false);
    }
  }

  async function sendReply() {
    if (!selectedMessage || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/messages/${selectedMessage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: replyText, status: "resolved" }),
      });
      if (res.ok) {
        setReplyText("");
        await fetchMessages();
        const updated = await res.json();
        setSelectedMessage(updated);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setReplying(false);
    }
  }

  const categoryColors: Record<string, string> = {
    complaint: "text-red bg-red/10",
    feedback: "text-blue bg-blue/10",
    support: "text-green bg-green/10",
    other: "text-muted bg-muted-bg",
  };

  const priorityColors: Record<string, string> = {
    low: "text-muted",
    normal: "text-blue",
    high: "text-yellow",
    urgent: "text-red",
  };

  const statusIcons: Record<string, any> = {
    unread: Clock,
    read: CheckCircle,
    resolved: CheckCircle,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Message Center</h1>
          <p className="text-muted text-sm">Manage complaints, feedback, and support requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={filteredMessages.length === 0}
            className="text-red hover:text-red hover:bg-red/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
          <Filter className="h-4 w-4 text-muted" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg bg-muted-bg border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-3">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
              <input
                type="text"
                placeholder="Search messages by name, email, or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-muted-bg border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              />
            </div>
          </div>
          {filteredMessages.length === 0 ? (
            <Card className="p-6 text-center text-muted">
              No messages found
            </Card>
          ) : (
            filteredMessages.map((msg) => {
              const StatusIcon = statusIcons[msg.status] || Clock;
              return (
                <Card
                  key={msg.id}
                  className={`cursor-pointer p-4 transition-all ${
                    selectedMessage?.id === msg.id ? "border-blue bg-blue/5" : "hover:border-blue/30"
                  }`}
                  onClick={() => setSelectedMessage(msg)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${msg.status === "unread" ? "text-blue" : "text-muted"}`} />
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted-bg">
                        {msg.category}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${priorityColors[msg.priority]}`}>
                      {msg.priority}
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{msg.subject}</p>
                  <p className="text-xs text-muted mb-2">{msg.name}</p>
                  <p className="text-xs text-muted">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              );
            })
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[selectedMessage.category]}`}>
                      {selectedMessage.category}
                    </span>
                    <span className={`text-xs font-medium ${priorityColors[selectedMessage.priority]}`}>
                      {selectedMessage.priority}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleting(selectedMessage)}
                  disabled={deletingId === selectedMessage?.id}
                  className="text-red hover:text-red hover:bg-red/10"
                >
                  {deletingId === selectedMessage?.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted mb-1">From</p>
                    <p className="font-medium">{selectedMessage.name}</p>
                    <p className="text-muted">{selectedMessage.email}</p>
                  </div>
                  <div>
                    <p className="text-muted mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedMessage.status}
                        onChange={(e) => updateStatus(selectedMessage.id, e.target.value)}
                        className="rounded-lg bg-muted-bg border border-white/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      >
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-muted mb-2">Message</p>
                  <p className="text-sm leading-relaxed bg-muted-bg/50 p-4 rounded-lg">
                    {selectedMessage.message}
                  </p>
                </div>

                {selectedMessage.adminReply && (
                  <div>
                    <p className="text-muted mb-2">Your Reply</p>
                    <p className="text-sm leading-relaxed bg-blue/5 p-4 rounded-lg border border-blue/20">
                      {selectedMessage.adminReply}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Replied on {selectedMessage.repliedAt ? new Date(selectedMessage.repliedAt).toLocaleString() : ""}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-start gap-2 mb-3">
                  <Reply className="h-4 w-4 text-muted mt-1" />
                  <p className="text-sm font-medium">Reply to {selectedMessage.name}</p>
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full rounded-lg bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue resize-none"
                />
                <div className="flex justify-end mt-3">
                  <Button onClick={sendReply} loading={replying} loadingText="Sending..." disabled={!replyText.trim()}>
                    <Reply className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted mx-auto mb-4" />
              <p className="text-muted">Select a message to view details</p>
            </Card>
          )}
        </div>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete Message"
          message={<>Are you sure you want to delete this message from <span className="font-semibold">{deleting.name}</span>? This action cannot be undone.</>}
          confirmLabel="Delete Message"
          isLoading={deletingId === deleting.id}
          onConfirm={() => deleteMessage(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}

      {showDeleteAllConfirm && (
        <ConfirmDialog
          title="Delete All Messages"
          message={<>Are you sure you want to delete <span className="font-semibold">{filteredMessages.length} messages</span>? This action cannot be undone.</>}
          confirmLabel="Delete All Messages"
          isLoading={deletingAll}
          onConfirm={() => {
            setShowDeleteAllConfirm(false);
            deleteAllMessages();
          }}
          onCancel={() => setShowDeleteAllConfirm(false)}
        />
      )}
    </div>
  );
}
