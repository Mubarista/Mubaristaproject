import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapKeysToCamelCase, keysToSnakeCase } from "@/lib/supabase-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", userId).single();
      if (error) throw error;
      return NextResponse.json(mapKeysToCamelCase(data));
    } else {
      // Get current authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json(null);
      }
      const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", session.user.id).single();
      if (error) {
        // If user not found in users table, return minimal user data from auth
        return NextResponse.json({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
          role: "user",
          isPremium: false,
          avatar: null,
        });
      }
      return NextResponse.json(mapKeysToCamelCase(data));
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(null);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      // Get current authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      
      // Check if user exists in users table
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { data: newUser, error: createError } = await supabaseAdmin
          .from("users")
          .insert({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
            role: "user",
            is_premium: false,
            ...keysToSnakeCase(updateData),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return NextResponse.json(mapKeysToCamelCase(newUser));
      }
      
      if (checkError) throw checkError;
      
      // Update existing user
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({ ...keysToSnakeCase(updateData), updated_at: new Date().toISOString() })
        .eq("id", session.user.id)
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json(mapKeysToCamelCase(data));
    } else {
      const { data, error } = await supabaseAdmin.from("users").update({ ...keysToSnakeCase(updateData), updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return NextResponse.json(mapKeysToCamelCase(data));
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    const { error } = await supabaseAdmin.from("users").delete().eq("id", userId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
