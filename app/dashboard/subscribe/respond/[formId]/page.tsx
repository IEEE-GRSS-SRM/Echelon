import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RespondFormClient } from "./components/respond-form-client";

type RawFormRow = {
  id: string | number;
  user_id: string;
  form_name: string | null;
  form_data: unknown;
  form_published: boolean | null;
};

export default async function RespondToFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  if (!formId) {
    redirect("/dashboard/subscribe");
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
    .select("id, user_id, form_name, form_data, form_published")
    .eq("id", formId)
    .maybeSingle();

  if (formError || !formRow) {
    redirect("/dashboard/subscribe");
  }

  const form = formRow as RawFormRow;

  if (!form.form_published) {
    redirect("/dashboard/subscribe");
  }

  const { data: subscriptionRow, error: subscriptionError } = await supabase
    .from("Subscribe")
    .select("subscriber")
    .eq("subscriber", user.id)
    .eq("subscribee", form.user_id)
    .limit(1)
    .maybeSingle();

  if (subscriptionError || !subscriptionRow) {
    redirect("/dashboard/subscribe");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard/subscribe">
              <ArrowLeft className="size-4" />
              Back to subscribe
            </Link>
          </Button>
        </div>

        <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Respond to Form</CardTitle>
            <CardDescription>
              Fill out the form and submit your response.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RespondFormClient
              formId={String(form.id)}
              formName={form.form_name}
              formData={form.form_data}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
