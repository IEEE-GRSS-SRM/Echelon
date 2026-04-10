"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleAlert, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

type AuthPageProps = {
  initialMode: AuthMode;
  redirectTo?: string;
};

export function AuthPage({ initialMode, redirectTo = "/dashboard" }: AuthPageProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();

    if (mode === "register") {
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from("Profiles")
        .select("email")
        .ilike("email", normalizedEmail)
        .limit(1)
        .maybeSingle();

      if (existingProfileError) {
        setError("Unable to verify account status. Please try again.");
        setLoading(false);
        return;
      }

      if (existingProfile) {
        setError("Account already exists.");
        setLoading(false);
        return;
      }
    }

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          })
        : await supabase.auth.signUp({
            email: normalizedEmail,
            password,
          });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "register" && !result.data.session) {
      setSuccess("Account created. Check your inbox if confirmation is enabled.");
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-12">
          <section className="flex flex-col justify-center gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
              <LockKeyhole className="size-3.5" />
              εchelon authentication
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {mode === "login" ? "Welcome back to εchelon." : "Create your εchelon account."}
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                {mode === "login"
                  ? "Sign in with email and password, then land in the protected dashboard."
                  : "Register with email and password. The flow is ready for confirmation if you enable it later."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <Mail className="mb-3 size-5 text-slate-700" />
                <p className="text-sm font-medium text-slate-900">Email/password</p>
                <p className="mt-1 text-sm text-slate-500">Simple Supabase auth with one session source.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <CheckCircle2 className="mb-3 size-5 text-slate-700" />
                <p className="text-sm font-medium text-slate-900">Protected routes</p>
                <p className="mt-1 text-sm text-slate-500">Dashboard access is gated in middleware.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <CircleAlert className="mb-3 size-5 text-slate-700" />
                <p className="text-sm font-medium text-slate-900">Password recovery</p>
                <p className="mt-1 text-sm text-slate-500">Reset flow handled from the login screen.</p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center">
            <Card className="w-full max-w-xl border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <Button type="button" variant={mode === "login" ? "default" : "ghost"} className="flex-1 rounded-xl" onClick={() => setMode("login")}>Login</Button>
                  <Button type="button" variant={mode === "register" ? "default" : "ghost"} className="flex-1 rounded-xl" onClick={() => setMode("register")}>Register</Button>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>

                  {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                  {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

                  <Button type="submit" size="lg" className="h-12 w-full rounded-full px-6" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : mode === "login" ? "Sign in" : "Create account"}
                    {!loading ? <ArrowRight className="size-4" /> : null}
                  </Button>
                </form>

                <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
                    <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                      {mode === "login" ? "Register" : "Login"}
                    </Button>
                  </p>

                  {mode === "login" ? (
                    <Link className="font-medium text-slate-900 underline-offset-4 hover:underline" href="/reset-password">
                      Forgot password?
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}