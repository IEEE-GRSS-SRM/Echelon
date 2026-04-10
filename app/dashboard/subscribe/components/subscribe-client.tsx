"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SubscribeeSummary = {
  user_id: string;
  email: string | null;
};

type PublishedFormSummary = {
  id: string;
  form_name: string | null;
  form_data: unknown;
  created_at: string | null;
};

type SubscribeClientProps = {
  currentUserId: string;
  initialSubscribees: SubscribeeSummary[];
};

type RawProfileRow = {
  user_id: string;
  email: string | null;
};

type RawFormRow = {
  id: string | number;
  form_name: string | null;
  form_data: unknown;
  created_at: string | null;
};

function getFallbackFormName(form: PublishedFormSummary) {
  if (typeof form.form_name === "string" && form.form_name.trim().length > 0) {
    return form.form_name.trim();
  }

  if (form.form_data && typeof form.form_data === "object" && !Array.isArray(form.form_data)) {
    const maybeName = (form.form_data as Record<string, unknown>).name;
    if (typeof maybeName === "string" && maybeName.trim().length > 0) {
      return maybeName.trim();
    }
  }

  return "Untitled form";
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) {
    return 0;
  }

  if (a.length === 0) {
    return b.length;
  }

  if (b.length === 0) {
    return a.length;
  }

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < cols; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost
      );
    }
  }

  return matrix[a.length][b.length];
}

function getSearchScore(name: string, query: string) {
  const normalizedName = name.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return Math.abs(normalizedName.length - normalizedQuery.length) / 100;
  }

  return levenshteinDistance(normalizedName, normalizedQuery);
}

function getReadableDate(dateValue: string | null | undefined) {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString();
}

function getRelativeDateLabel(dateValue: string | null | undefined) {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const now = Date.now();
  const diffMs = parsed.getTime() - now;
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (absMs < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }

  if (absMs < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }

  if (absMs < month) {
    return rtf.format(Math.round(diffMs / day), "day");
  }

  if (absMs < year) {
    return rtf.format(Math.round(diffMs / month), "month");
  }

  return rtf.format(Math.round(diffMs / year), "year");
}

export function SubscribeClient({ currentUserId, initialSubscribees }: SubscribeClientProps) {
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribees, setSubscribees] = useState(initialSubscribees);
  const [subscribeeSearch, setSubscribeeSearch] = useState("");
  const [formSearch, setFormSearch] = useState("");
  const [selectedSubscribee, setSelectedSubscribee] = useState<SubscribeeSummary | null>(null);
  const [formsBySubscribee, setFormsBySubscribee] = useState<Record<string, PublishedFormSummary[]>>({});
  const [isSubmittingSubscribe, setIsSubmittingSubscribe] = useState(false);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [error, setError] = useState("");

  const filteredSubscribees = useMemo(() => {
    const query = subscribeeSearch.toLowerCase().trim();

    if (!query) {
      return subscribees;
    }

    return subscribees.filter((subscribee) => (subscribee.email ?? "").toLowerCase().includes(query));
  }, [subscribeeSearch, subscribees]);

  async function handleSubscribe() {
    setError("");
    const supabase = createSupabaseBrowserClient();

    const normalizedEmail = subscribeEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter an email address to subscribe.");
      return;
    }

    setIsSubmittingSubscribe(true);

    try {
      const { data: profileRow, error: profileError } = await supabase
        .from("Profiles")
        .select("user_id, email")
        .ilike("email", normalizedEmail)
        .limit(1)
        .maybeSingle();

      if (profileError) {
        setError(`Could not find user by email: ${profileError.message}`);
        return;
      }

      if (!profileRow) {
        setError("No account found with that email.");
        return;
      }

      const profile = profileRow as RawProfileRow;

      if (profile.user_id === currentUserId) {
        setError("You cannot subscribe to yourself.");
        return;
      }

      const alreadySubscribed = subscribees.some((subscribee) => subscribee.user_id === profile.user_id);
      if (!alreadySubscribed) {
        const { error: insertError } = await supabase.from("Subscribe").insert({
          subscriber: currentUserId,
          subscribee: profile.user_id,
        });

        if (insertError) {
          if (insertError.code === "23505") {
            setError("You are already subscribed to this account.");
          } else {
            setError(`Failed to subscribe: ${insertError.message}`);
          }
          return;
        }

        setSubscribees((current) =>
          [...current, { user_id: profile.user_id, email: profile.email }].sort((a, b) =>
            (a.email ?? "").localeCompare(b.email ?? "")
          )
        );
      }

      const nextSelected = { user_id: profile.user_id, email: profile.email };
      setSelectedSubscribee(nextSelected);
      setSubscribeEmail("");
      await loadPublishedForms(nextSelected);
    } finally {
      setIsSubmittingSubscribe(false);
    }
  }

  async function loadPublishedForms(subscribee: SubscribeeSummary) {
    setError("");
    setSelectedSubscribee(subscribee);
    setFormSearch("");

    if (formsBySubscribee[subscribee.user_id]) {
      return;
    }

    setIsLoadingForms(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: formsError } = await supabase
        .from("Forms")
        .select("id, form_name, form_data, created_at")
        .eq("user_id", subscribee.user_id)
        .eq("form_published", true);

      if (formsError) {
        setError(`Failed to load published forms: ${formsError.message}`);
        return;
      }

      const forms = ((data ?? []) as RawFormRow[]).map((row) => ({
        id: String(row.id),
        form_name: row.form_name,
        form_data: row.form_data,
        created_at: row.created_at ?? null,
      }));

      setFormsBySubscribee((current) => ({
        ...current,
        [subscribee.user_id]: forms,
      }));
    } finally {
      setIsLoadingForms(false);
    }
  }

  const selectedForms = selectedSubscribee ? formsBySubscribee[selectedSubscribee.user_id] ?? [] : [];

  const rankedForms = useMemo(() => {
    return selectedForms
      .map((form) => ({
        form,
        displayName: getFallbackFormName(form),
      }))
      .map((entry) => ({
        ...entry,
        score: getSearchScore(entry.displayName, formSearch),
      }))
      .sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }

        return a.displayName.localeCompare(b.displayName);
      });
  }, [selectedForms, formSearch]);

  const filteredForms = rankedForms.filter((entry) => {
    if (!formSearch.trim()) {
      return true;
    }

    const threshold = Math.max(2, Math.ceil(formSearch.trim().length * 0.6));
    return entry.score <= threshold || entry.displayName.toLowerCase().includes(formSearch.toLowerCase().trim());
  });

  return (
    <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-slate-200/80 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Find by Email</CardTitle>
          <CardDescription>Subscribe to a user to see their published forms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={subscribeEmail}
              onChange={(event) => setSubscribeEmail(event.target.value)}
            />
            <Button
              type="button"
              onClick={() => void handleSubscribe()}
              disabled={isSubmittingSubscribe}
            >
              {isSubmittingSubscribe ? <Loader2 className="size-4 animate-spin" /> : "Subscribe"}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search my subscribees"
                value={subscribeeSearch}
                onChange={(event) => setSubscribeeSearch(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-900">My Subscribees</h3>
              {filteredSubscribees.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                  No subscribees yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSubscribees.map((subscribee) => {
                    const isSelected = selectedSubscribee?.user_id === subscribee.user_id;

                    return (
                      <button
                        key={subscribee.user_id}
                        type="button"
                        onClick={() => void loadPublishedForms(subscribee)}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        {subscribee.email ?? "Unknown email"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Published Forms</CardTitle>
          <CardDescription>
            {selectedSubscribee
              ? `Forms published by ${selectedSubscribee.email ?? "selected user"}`
              : "Select a subscribee to view their published forms."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedSubscribee ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-500">
              Choose a subscribee from the list.
            </div>
          ) : isLoadingForms ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-8 text-sm text-slate-600">
              <Loader2 className="size-4 animate-spin" />
              Loading published forms...
            </div>
          ) : selectedForms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-500">
              No published forms found.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Search published forms by name"
                  value={formSearch}
                  onChange={(event) => setFormSearch(event.target.value)}
                />
              </div>

              {filteredForms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-500">
                  No forms match your search.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredForms.map(({ form }) => (
                    <div
                      key={form.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <p className="font-medium text-slate-900">{getFallbackFormName(form)}</p>
                      <p className="text-xs text-slate-500">
                        Created: {getReadableDate(form.created_at) ?? "Unavailable"}
                        {getRelativeDateLabel(form.created_at) ? ` (${getRelativeDateLabel(form.created_at)})` : ""}
                      </p>
                      <div className="mt-3">
                        <Button asChild type="button" size="sm" className="rounded-full">
                          <Link href={`/dashboard/subscribe/respond/${form.id}`}>
                            Respond <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
