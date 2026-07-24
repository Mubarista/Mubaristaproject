import { supabaseAdmin } from "@/lib/supabase-admin";
import { AutoRedirect } from "@/components/team/auto-redirect";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function TeamInvitePage({ params }: Props) {
  const { token } = await params;

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("invite_url, invite_expires_at")
    .eq("invite_token", token)
    .maybeSingle();

  if (error || !data || !data.invite_expires_at || new Date(data.invite_expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background text-center">
        <div className="glass-card rounded-2xl p-8 max-w-md">
          <h1 className="text-xl font-semibold mb-2">Link expired or invalid</h1>
          <p className="text-muted text-sm">This access link is no longer valid. Please ask your admin for a new link.</p>
        </div>
      </div>
    );
  }

  return <AutoRedirect url={data.invite_url} fallback="/mbhubteam" />;
}
