import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FormsListClient, type FormSummary } from "./components/forms-list-client";

type RawFormRow = {
  id: string | number;
  form_name: string | null;
  form_data: unknown;
  form_published: boolean | null;
  created_at: string | null;
};

export default async function FormsViewerPage() {
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

  const { data, error } = await supabase
    .from("Forms")
    .select("id, form_name, form_data, form_published, created_at")
    .eq("user_id", user.id);

  const forms: FormSummary[] = ((data ?? []) as RawFormRow[]).map((row) => ({
    id: String(row.id),
    form_name: row.form_name,
    form_data: row.form_data,
    form_published: row.form_published ?? false,
    created_at: row.created_at ?? null,
  }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>

          <Button asChild className="rounded-full">
            <Link href="/components/form-builder">
              <Plus className="size-4" />
              New form
            </Link>
          </Button>
        </div>

        <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Your Forms</CardTitle>
            <CardDescription>
              Browse all saved forms and jump into editing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load forms: {error.message}
              </div>
            ) : (
              <FormsListClient forms={forms} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
