import { redirect } from "next/navigation";

import { AuthPage } from "@/components/auth/auth-page";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: {
    redirectTo?: string;
  };
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthPage initialMode="login" redirectTo={searchParams?.redirectTo} />;
}