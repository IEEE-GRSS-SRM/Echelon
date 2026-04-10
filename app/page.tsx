import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, LayoutTemplate, LockKeyhole, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 lg:px-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <section className="flex flex-col justify-center gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
              <Sparkles className="size-3.5" />
              εchelon secure workspace
            </div>

            <div className="space-y-5">
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Welcome to εchelon.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Access publishing, subscriptions, and response analytics from one protected dashboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-6 shadow-lg shadow-slate-900/10">
                <Link href="/login">
                  Login
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6">
                <Link href="/register">Register</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <LockKeyhole className="mb-3 size-5 text-slate-700" />
                <p className="text-sm font-medium text-slate-900">Protected dashboard</p>
                <p className="mt-1 text-sm text-slate-500">Logged-in users land in a guarded home.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <BadgeCheck className="mb-3 size-5 text-slate-700" />
                <p className="text-sm font-medium text-slate-900">Password recovery</p>
                <p className="mt-1 text-sm text-slate-500">Reset flow included end-to-end.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <LayoutTemplate className="mb-3 size-5 text-slate-700" />
                <p className="text-sm font-medium text-slate-900">Shared auth UI</p>
                <p className="mt-1 text-sm text-slate-500">Login and register share one clean layout.</p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center">
            <Card className="w-full max-w-xl border-slate-200/80 bg-white/80 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded-full bg-slate-200" />
                    <div className="h-8 w-44 rounded-lg bg-slate-200/80" />
                  </div>
                  <div className="h-9 w-20 rounded-full bg-slate-200" />
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="h-4 w-32 rounded-full bg-slate-200" />
                  <div className="h-10 w-full rounded-xl bg-slate-200" />
                  <div className="h-10 w-5/6 rounded-xl bg-slate-200" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="h-24 rounded-2xl bg-slate-200" />
                    <div className="h-24 rounded-2xl bg-slate-200" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="h-20 rounded-2xl bg-slate-200" />
                  <div className="h-20 rounded-2xl bg-slate-200" />
                  <div className="h-20 rounded-2xl bg-slate-200" />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}