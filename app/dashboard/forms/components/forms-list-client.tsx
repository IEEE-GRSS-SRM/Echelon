"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type FormSummary = {
  id: string;
  form_name: string | null;
  form_data: unknown;
  form_published: boolean;
  created_at: string | null;
};

type FormsListClientProps = {
  forms: FormSummary[];
};

function getFallbackName(form: FormSummary) {
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

export function FormsListClient({ forms }: FormsListClientProps) {
  const [query, setQuery] = useState("");
  const [publishFilter, setPublishFilter] = useState<"all" | "published" | "unpublished">("all");
  const [localForms, setLocalForms] = useState(forms);
  const [publishingFormId, setPublishingFormId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    setLocalForms(forms);
  }, [forms]);

  const handleTogglePublish = async (formId: string, currentPublishedState: boolean) => {
    const nextPublishedState = !currentPublishedState;

    setPublishError(null);
    setPublishingFormId(formId);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPublishError("You must be logged in to update publish status.");
        return;
      }

      const { error } = await supabase
        .from("Forms")
        .update({ form_published: nextPublishedState })
        .eq("id", formId)
        .eq("user_id", user.id);

      if (error) {
        setPublishError(`Failed to update publish status: ${error.message}`);
        return;
      }

      setLocalForms((currentForms) =>
        currentForms.map((form) =>
          form.id === formId ? { ...form, form_published: nextPublishedState } : form
        )
      );
    } finally {
      setPublishingFormId(null);
    }
  };

  const rankedForms = useMemo(() => {
    return localForms
      .map((form) => ({
        form,
        displayName: getFallbackName(form),
      }))
      .map((entry) => ({
        ...entry,
        score: getSearchScore(entry.displayName, query),
      }))
      .sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }

        return a.displayName.localeCompare(b.displayName);
      });
  }, [localForms, query]);

  const filteredForms = rankedForms.filter((entry) => {
    if (publishFilter === "published" && !entry.form.form_published) {
      return false;
    }

    if (publishFilter === "unpublished" && entry.form.form_published) {
      return false;
    }

    if (!query.trim()) {
      return true;
    }

    const threshold = Math.max(2, Math.ceil(query.trim().length * 0.6));
    return entry.score <= threshold || entry.displayName.toLowerCase().includes(query.toLowerCase().trim());
  });

  return (
    <section className="space-y-4">
      <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle className="text-lg">Search Forms</CardTitle>
          <CardDescription>
            Search by name with typo tolerance and filter by publish status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Find a form by name"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={publishFilter === "all" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setPublishFilter("all")}
              >
                All
              </Button>
              <Button
                type="button"
                size="sm"
                variant={publishFilter === "published" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setPublishFilter("published")}
              >
                Published
              </Button>
              <Button
                type="button"
                size="sm"
                variant={publishFilter === "unpublished" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setPublishFilter("unpublished")}
              >
                Unpublished
              </Button>
            </div>

            {publishError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {publishError}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {filteredForms.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white/70">
            <CardContent className="py-10 text-center text-sm text-slate-500">
              No forms match your search.
            </CardContent>
          </Card>
        ) : (
          filteredForms.map(({ form, displayName }) => (
            <Card key={form.id} className="border-slate-200/80 bg-white/90 shadow-sm transition hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-3 py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{displayName}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        form.form_published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {form.form_published ? "Published" : "Unpublished"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Created: {getReadableDate(form.created_at) ?? "Unavailable"}
                    {getRelativeDateLabel(form.created_at) ? ` (${getRelativeDateLabel(form.created_at)})` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={form.form_published ? "outline" : "secondary"}
                    className="rounded-full"
                    onClick={() => void handleTogglePublish(form.id, form.form_published)}
                    disabled={publishingFormId === form.id}
                  >
                    {publishingFormId === form.id
                      ? "Updating..."
                      : form.form_published
                        ? "Unpublish form"
                        : "Publish form"}
                  </Button>

                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link href={`/dashboard/forms/${form.id}/responses`}>
                      View responses
                    </Link>
                  </Button>

                  <Button asChild size="sm" className="rounded-full">
                    <Link href={`/components/form-builder?formId=${form.id}`}>
                      Edit form <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
