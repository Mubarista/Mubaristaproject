"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { mapKeysToCamelCase } from "@/lib/supabase-utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { LiveChatMessage } from "@/types";

const DISAPPEAR_MS = 5000;

export default function LiveChatPage() {
  const searchParams = useSearchParams();
  const competitionId = searchParams.get("competitionId") || "";
  const participantName = searchParams.get("participantName") || "Barista";
  const { user } = useAuth();
  const userId = user?.id || participantName;

  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const timers = useRef<Record<string, NodeJS.Timeout>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const removeMessage = useCallback(
    async (message: LiveChatMessage) => {
      if (!message.id) return;
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      try {
        await fetch("/api/live-chat/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: message.id, userId }),
        });
      } catch (err) {
        console.error("Failed to mark message as read:", err);
      }
    },
    [userId]
  );

  const scheduleDisappear = useCallback(
    (message: LiveChatMessage) => {
      if (!message.id || timers.current[message.id]) return;
      timers.current[message.id] = setTimeout(() => {
        removeMessage(message);
      }, DISAPPEAR_MS);
    },
    [removeMessage]
  );

  useEffect(() => {
    if (!competitionId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      try {
        const res = await fetch(`/api/live-chat?competitionId=${encodeURIComponent(competitionId)}`);
        if (!res.ok) throw new Error("Failed to load chat");
        const data = (await res.json()) as LiveChatMessage[];
        if (isMounted) {
          setMessages(data);
          data.forEach(scheduleDisappear);
        }
      } catch (err) {
        console.error("Error loading live chat:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    const channel = supabase.channel(`live-chat-${competitionId}`);
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `competition_id=eq.${competitionId}`,
        },
        (payload) => {
          const newMsg = mapKeysToCamelCase(payload.new as Record<string, unknown>) as LiveChatMessage;
          if (!newMsg.id) return;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scheduleDisappear(newMsg);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
      supabase.removeChannel(channel);
      Object.values(timers.current).forEach((t) => clearTimeout(t));
    };
  }, [competitionId, scheduleDisappear]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !competitionId) return;

    setSending(true);
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId,
          userId,
          participantName,
          message: text,
        }),
      });
      if (res.ok) {
        setInput("");
      } else {
        alert("Failed to send message.");
      }
    } catch (err) {
      console.error("Send error:", err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="mx-auto max-w-3xl h-[calc(100vh-4rem)] flex flex-col px-4">
        <Card className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-blue" />
            <CardTitle className="text-lg">Live Chat</CardTitle>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted">Loading chat...</div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className={`p-3 rounded-xl ${
                      msg.userId === userId
                        ? "bg-blue/10 border border-blue/30"
                        : "bg-muted-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-blue">
                        {msg.participantName || "Barista"}
                      </span>
                      <span className="text-xs text-muted">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{msg.message}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}

          <form onSubmit={sendMessage} className="mt-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-xl bg-muted-bg border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
              disabled={sending}
            />
            <Button
              type="submit"
              variant="premium"
              size="lg"
              disabled={!input.trim() || sending}
              className="px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
