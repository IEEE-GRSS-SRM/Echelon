import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

function createMissingBrowserClient() {
  const missingConfigError = new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required to use Supabase auth."
  );

  return {
    auth: {
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: missingConfigError,
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: missingConfigError,
      }),
      signOut: async () => ({ error: missingConfigError }),
      resetPasswordForEmail: async () => ({
        data: {},
        error: missingConfigError,
      }),
      updateUser: async () => ({
        data: { user: null },
        error: missingConfigError,
      }),
      getSession: async () => ({
        data: { session: null },
        error: missingConfigError,
      }),
    },
  } as ReturnType<typeof createBrowserClient>;
}

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return createMissingBrowserClient();
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}