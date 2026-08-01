import { supabaseAdmin } from "@/lib/supabase-admin";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  description: string;
  type: string;
  metadata?: Record<string, any>;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: input.userId,
      title: input.title,
      description: input.description,
      type: input.type,
      read: false,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to create notification:", error);
    }
  } catch (error) {
    console.error("createNotification error:", error);
  }
}
