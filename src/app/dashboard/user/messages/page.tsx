"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { MessageSquare, CheckCircle, Clock, Trash2, Reply } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

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
}

export default function UserMessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, filter]);

  async function fetchMessages() {
    if (!user) return;
    try {
      const url = filter === "all" 
        ? `/api/messages?userId=${user.id}` 
        : `/api/messages?userId=${user.id}&status=${filter}`;
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Please log in to view your messages</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Messages</h1>
          <p className="text-muted text-sm">View your support requests and admin replies.</p>
        </div>
        <div className="flex items-center gap-3">
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
          {messages.length === 0 ? (
            <Card className="p-6 text-center text-muted">
              No messages found
            </Card>
          ) : (
            messages.map((msg) => {
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
                  <h3 className="font-medium text-sm mb-1">{msg.subject}</h3>
                  <p className="text-xs text-muted mb-2">{new Date(msg.createdAt).toLocaleDateString()}</p>
                  {msg.adminReply && (
                    <div className="flex items-center gap-1 text-xs text-green">
                      <Reply className="h-3 w-3" />
                      Replied
                    </div>
                  )}
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
                  <h2 className="text-xl font-bold mb-2">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span>{selectedMessage.name}</span>
                    <span>•</span>
                    <span>{selectedMessage.email}</span>
                    <span>•</span>
                    <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[selectedMessage.category]}`}>
                    {selectedMessage.category}
                  </span>
                  <span className={`text-xs font-medium ${priorityColors[selectedMessage.priority]}`}>
                    {selectedMessage.priority}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Your Message</h3>
                  <div className="bg-muted-bg rounded-lg p-4 text-sm">
                    {selectedMessage.message}
                  </div>
                </div>

                {selectedMessage.adminReply && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Admin Reply</h3>
                    <div className="bg-green/10 rounded-lg p-4 text-sm border border-green/20">
                      {selectedMessage.adminReply}
                      <div className="mt-2 text-xs text-muted">
                        Replied on {selectedMessage.repliedAt ? new Date(selectedMessage.repliedAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {!selectedMessage.adminReply && selectedMessage.status === "unread" && (
                  <div className="text-sm text-muted">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Awaiting admin response
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a message to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
