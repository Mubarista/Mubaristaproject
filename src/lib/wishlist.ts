import { supabase } from "@/lib/supabase";

export interface WishlistRow {
  item_id: string;
  item_type: "book" | "tool";
}

export async function getWishlist(): Promise<WishlistRow[]> {
  const { data, error } = await supabase
    .from("wishlists")
    .select("item_id, item_type")
    .order("created_at", { ascending: false });
  if (error) {
    return [];
  }
  return (data as WishlistRow[]) || [];
}

export async function addWishlistItem(itemId: string, itemType: "book" | "tool") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Please login to add items to wishlist" };
  }

  const { error } = await supabase
    .from("wishlists")
    .insert({ user_id: user.id, item_id: itemId, item_type: itemType })
    .select()
    .single();
  if (error) {
    if (error.message?.includes("duplicate key")) {
      return { success: true, message: "Already in wishlist" };
    }
    return { success: false, message: error.message };
  }
  return { success: true, message: "Added to wishlist" };
}

export async function removeWishlistItem(itemId: string, itemType: "book" | "tool") {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("item_id", itemId)
    .eq("item_type", itemType);
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, message: "Removed from wishlist" };
}

export async function isInWishlist(itemId: string, itemType: "book" | "tool"): Promise<boolean> {
  const { count, error } = await supabase
    .from("wishlists")
    .select("*", { count: "exact", head: true })
    .eq("item_id", itemId)
    .eq("item_type", itemType);
  if (error) {
    return false;
  }
  return (count || 0) > 0;
}
