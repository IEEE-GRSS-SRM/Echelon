import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ResponsesDashboardClient, type ResponseRowForDashboard } from "./components/responses-dashboard-client";

type RawFormRow = {
  id: string | number;
  form_name: string | null;
  user_id: string;
};

type RawResponseRow = {
  form_id: string | number;
  responser: string;
  response: unknown;
  created_at?: string | null;
};

type RawProfileRow = {
  user_id: string;
  email: string | null;
};

export default async function FormResponsesPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  if (!formId) {
    redirect("/dashboard/forms");
  }

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

  const { data: formRow, error: formError } = await supabase
    .from("Forms")
    .select("id, form_name, user_id")
    .eq("id", formId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (formError || !formRow) {
    redirect("/dashboard/forms");
  }

  const form = formRow as RawFormRow;

  const responsesWithDateResult = await supabase
    .from("Response")
    .select("form_id, responser, response, created_at")
    .eq("form_id", form.id);

  let responseRows: RawResponseRow[] = [];
  if (responsesWithDateResult.error) {
    const fallbackResponsesResult = await supabase
      .from("Response")
      .select("form_id, responser, response")
      .eq("form_id", form.id);

    if (fallbackResponsesResult.error) {
      redirect("/dashboard/forms");
    }

    responseRows = (fallbackResponsesResult.data ?? []) as RawResponseRow[];
  } else {
    responseRows = (responsesWithDateResult.data ?? []) as RawResponseRow[];
  }

  const responderIds = Array.from(
    new Set(
      responseRows
        .map((row) => row.responser)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  let profilesById = new Map<string, string | null>();

  if (responderIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("Profiles")
      .select("user_id, email")
      .in("user_id", responderIds);

    profilesById = new Map(
      ((profileRows ?? []) as RawProfileRow[]).map((row) => [row.user_id, row.email])
    );
  }

  const dashboardRows: ResponseRowForDashboard[] = responseRows.map((row) => ({
    form_id: String(row.form_id),
    responser: row.responser,
    response: row.response,
    created_at: row.created_at ?? null,
    responser_email: profilesById.get(row.responser) ?? null,
  }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard/forms">
              <ArrowLeft className="size-4" />
              Back to forms
            </Link>
          </Button>
        </div>

        <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Response Dashboard</CardTitle>
            <CardDescription>
              Responses for {form.form_name?.trim() || "Untitled form"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsesDashboardClient
              formName={form.form_name}
              rows={dashboardRows}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
