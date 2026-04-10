import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SubscribeClient, type SubscribeeSummary } from "./components/subscribe-client";

type RawSubscriptionRow = {
  subscribee: string | null;
};

type RawProfileRow = {
  user_id: string;
  email: string | null;
};

export default async function SubscribePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!("from" in supabase)) {
    redirect("/login");
  }

  const { data: subscribeRows, error: subscribeError } = await supabase
    .from("Subscribe")
    .select("subscribee")
    .eq("subscriber", user.id);

  const subscribeeIds = Array.from(
    new Set(
      ((subscribeRows ?? []) as RawSubscriptionRow[])
        .map((row) => row.subscribee)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  let subscribees: SubscribeeSummary[] = [];
  let loadError = subscribeError ? subscribeError.message : "";

  if (!loadError && subscribeeIds.length > 0) {
    const { data: profileRows, error: profileError } = await supabase
      .from("Profiles")
      .select("user_id, email")
      .in("user_id", subscribeeIds);

    if (profileError) {
      loadError = profileError.message;
    } else {
      subscribees = ((profileRows ?? []) as RawProfileRow[])
        .filter((row) => typeof row.user_id === "string" && row.user_id.length > 0)
        .map((row) => ({
          user_id: row.user_id,
          email: row.email,
        }))
        .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>

        <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Subscribe</CardTitle>
            <CardDescription>
              Subscribe by email, browse your subscribees, and view their published forms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load subscriptions: {loadError}
              </div>
            ) : (
              <SubscribeClient
                currentUserId={user.id}
                initialSubscribees={subscribees}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
