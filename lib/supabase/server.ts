import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function createMissingServerClient() {
  const missingConfigError = new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required to use Supabase auth."
  );

  return {
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: missingConfigError,
      }),
    },
  };
}

export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return createMissingServerClient();
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes("Cookies can only be modified in a Server Action or Route Handler")) {
              throw error;
            }
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes("Cookies can only be modified in a Server Action or Route Handler")) {
              throw error;
            }
          }
        },
      },
    }
  );
}