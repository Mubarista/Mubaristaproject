"use client";

import { useEffect, useRef } from "react";
import { supabaseAdminAuth } from "./supabase";

const tables = [
  "competitions",
  "competition_applications",
  "winners",
  "payments",
  "users",
  "platform_stats",
  "testimonials",
  "articles",
  "books",
  "tools",
  "jobs",
  "schools",
  "timeline",
  "legends",
  "sponsors",
  "coffee_facts",
  "faqs",
  "learn_categories",
  "latte_art",
  "tips",
  "judges",
  "messages",
  "subscription_plans",
];

export function useRealtimeAdmin(onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const channel = supabaseAdminAuth.channel("admin-overview");

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        () => {
          onChangeRef.current();
        }
      );
    });

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("Admin overview realtime channel error:", status);
      }
    });

    return () => {
      channel.unsubscribe();
      supabaseAdminAuth.removeChannel(channel);
    };
  }, []);
}
