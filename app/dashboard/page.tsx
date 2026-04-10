import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, LayoutDashboard, Shield, UserCircle2, Users } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email ?? "Signed-in user";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    <LayoutDashboard className="size-3.5" />
                    Protected dashboard
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    You are signed in.
                  </h1>
                  <p className="text-sm leading-6 text-slate-600 sm:text-base">
                    This page is guarded by middleware and server-side session checks.
                  </p>
                </div>
                <LogoutButton />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <CheckCircle2 className="mb-3 size-5 text-slate-700" />
                  <p className="text-sm font-medium text-slate-900">Authentication healthy</p>
                  <p className="mt-1 text-sm text-slate-500">Your account is verified and ready for dashboard actions.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Shield className="mb-3 size-5 text-slate-700" />
                  <p className="text-sm font-medium text-slate-900">Route protected</p>
                  <p className="mt-1 text-sm text-slate-500">Unauthenticated users are redirected to login.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <UserCircle2 className="mb-3 size-5 text-slate-700" />
                  <p className="text-sm font-medium text-slate-900">Account</p>
                  <p className="mt-1 text-sm text-slate-500">{email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/80 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Workspace</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Manage your form operations.</h2>
              </div>

              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>Manage forms, review incoming responses, and monitor participation from one place.</p>
                <p>Use Subscribe to answer published forms and Forms to publish, edit, and review analytics.</p>
              </div>

              <div className="space-y-3">
                <Button asChild variant="secondary" className="h-11 w-full rounded-full">
                  <a href="/dashboard/forms">
                    View forms <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-11 w-full rounded-full">
                  <a href="/dashboard/subscribe">
                    Subscribe <Users className="size-4" />
                  </a>
                </Button>
                <Button asChild className="h-11 w-full rounded-full">
                  <a href="/components/form-builder">
                    Form Builder <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-11 w-full rounded-full">
                  <a href="/">
                    Return home <ArrowRight className="size-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}