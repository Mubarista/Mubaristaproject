import { supabaseAdmin } from "@/lib/supabase-admin";

export interface CreateNotificationInput {
  userId?: string;
  type: string;
  title: string;
  message?: string;
  description?: string;
  link?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  isGlobal?: boolean;
}

export async function createNotification(input: CreateNotificationInput) {
  return supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message ?? input.description ?? "",
    link: input.link,
    data: input.data ?? input.metadata ?? {},
    is_global: input.isGlobal ?? false,
    read: false,
  }).select().single();
}

export async function createBulkNotifications(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId" | "isGlobal">
) {
  if (userIds.length === 0) return { error: null };
  const rows = userIds.map((userId) => ({
    user_id: userId,
    type: input.type,
    title: input.title,
    message: input.message ?? input.description ?? "",
    link: input.link,
    data: input.data ?? input.metadata ?? {},
    is_global: false,
    read: false,
  }));
  return supabaseAdmin.from("notifications").insert(rows);
}
