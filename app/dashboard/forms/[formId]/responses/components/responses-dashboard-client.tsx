"use client";

import { useMemo, useState } from "react";
import { BarChart3, Calendar, Mail, Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type ResponseRowForDashboard = {
  form_id: string;
  responser: string;
  responser_email: string | null;
  response: unknown;
  created_at: string | null;
};

type ParsedField = {
  label: string;
  type: string;
  value: string | number | string[] | null;
};

type ParsedUnit = {
  unit_id: string;
  unit_title: string;
  fields: ParsedField[];
};

type ParsedResponseEntry = {
  key: string;
  responderId: string;
  responderEmail: string;
  createdAt: string | null;
  units: ParsedUnit[];
  hasFileValue: boolean;
  answeredCount: number;
  emptyCount: number;
  searchableText: string;
};

type ResponsesDashboardClientProps = {
  formName: string | null;
  rows: ResponseRowForDashboard[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseUnitsFromResponse(rawResponse: unknown): ParsedUnit[] {
  let parsed: unknown = rawResponse;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.units)) {
    return [];
  }

  return parsed.units
    .filter((unit): unit is Record<string, unknown> => isRecord(unit))
    .map((unit, index) => {
      const fields = Array.isArray(unit.fields)
        ? unit.fields
            .filter((field): field is Record<string, unknown> => isRecord(field))
            .map((field) => ({
              label: typeof field.label === "string" ? field.label : "Field",
              type: typeof field.type === "string" ? field.type : "unknown",
              value:
                typeof field.value === "string" ||
                typeof field.value === "number" ||
                field.value === null ||
                Array.isArray(field.value)
                  ? (field.value as string | number | string[] | null)
                  : null,
            }))
        : [];

      return {
        unit_id: typeof unit.unit_id === "string" ? unit.unit_id : `unit-${index + 1}`,
        unit_title:
          typeof unit.unit_title === "string" && unit.unit_title.trim().length > 0
            ? unit.unit_title
            : `Unit ${index + 1}`,
        fields,
      };
    });
}

function isFieldFilled(value: ParsedField["value"]) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "number") {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return false;
}

function hasFileUrl(value: ParsedField["value"]) {
  if (typeof value !== "string") {
    return false;
  }

  return value.includes("ResponseUploads") || value.startsWith("http://") || value.startsWith("https://");
}

function formatFieldValue(value: ParsedField["value"]) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "(none)";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value.trim().length > 0 ? value : "(empty)";
  }

  return "(empty)";
}

function getReadableDateWithRelative(dateValue: string | null) {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const absolute = parsed.toLocaleString();
  const now = Date.now();
  const diffMs = parsed.getTime() - now;
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  let relative = "";
  if (absMs < hour) {
    relative = rtf.format(Math.round(diffMs / minute), "minute");
  } else if (absMs < day) {
    relative = rtf.format(Math.round(diffMs / hour), "hour");
  } else if (absMs < month) {
    relative = rtf.format(Math.round(diffMs / day), "day");
  } else if (absMs < year) {
    relative = rtf.format(Math.round(diffMs / month), "month");
  } else {
    relative = rtf.format(Math.round(diffMs / year), "year");
  }

  return `${absolute} (${relative})`;
}

function PieCard({
  title,
  description,
  slices,
}: {
  title: string;
  description: string;
  slices: Array<{ label: string; value: number; color: string }>;
}) {
  const total = slices.reduce((sum, slice) => sum + Math.max(slice.value, 0), 0);

  const gradient =
    total <= 0
      ? "conic-gradient(#e2e8f0 0deg 360deg)"
      : (() => {
          let start = 0;
          const segments = slices.map((slice) => {
            const angle = (Math.max(slice.value, 0) / total) * 360;
            const end = start + angle;
            const segment = `${slice.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
            start = end;
            return segment;
          });
          return `conic-gradient(${segments.join(", ")})`;
        })();

  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <div
          className="size-28 rounded-full border border-slate-200"
          style={{ background: gradient }}
          aria-label={title}
        />
        <div className="space-y-2">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              <span>{slice.label}: {slice.value}</span>
            </div>
          ))}
          <p className="text-xs text-slate-500">Total: {total}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResponsesDashboardClient({ formName, rows }: ResponsesDashboardClientProps) {
  const [query, setQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState("all");
  const [fileFilter, setFileFilter] = useState<"all" | "with-files" | "without-files">("all");
  const [completenessFilter, setCompletenessFilter] = useState<"all" | "complete" | "partial">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "email">("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const parsedEntries = useMemo<ParsedResponseEntry[]>(() => {
    return rows.map((row, index) => {
      const units = parseUnitsFromResponse(row.response);

      let answeredCount = 0;
      let emptyCount = 0;
      let hasFileValue = false;
      const searchableParts: string[] = [row.responser_email ?? "", row.responser];

      for (const unit of units) {
        searchableParts.push(unit.unit_title);

        for (const field of unit.fields) {
          searchableParts.push(field.label, field.type, formatFieldValue(field.value));

          if (isFieldFilled(field.value)) {
            answeredCount += 1;
          } else {
            emptyCount += 1;
          }

          if (hasFileUrl(field.value)) {
            hasFileValue = true;
          }
        }
      }

      return {
        key: `${row.responser}-${row.created_at ?? index}`,
        responderId: row.responser,
        responderEmail: row.responser_email ?? "Unknown email",
        createdAt: row.created_at,
        units,
        hasFileValue,
        answeredCount,
        emptyCount,
        searchableText: searchableParts.join(" ").toLowerCase(),
      };
    });
  }, [rows]);

  const uniqueEmails = useMemo(() => {
    return Array.from(new Set(parsedEntries.map((entry) => entry.responderEmail))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [parsedEntries]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    const filtered = parsedEntries.filter((entry) => {
      if (emailFilter !== "all" && entry.responderEmail !== emailFilter) {
        return false;
      }

      if (fileFilter === "with-files" && !entry.hasFileValue) {
        return false;
      }

      if (fileFilter === "without-files" && entry.hasFileValue) {
        return false;
      }

      if (completenessFilter === "complete" && entry.emptyCount > 0) {
        return false;
      }

      if (completenessFilter === "partial" && entry.emptyCount === 0) {
        return false;
      }

      if (fromDate && entry.createdAt) {
        const from = new Date(`${fromDate}T00:00:00.000Z`);
        const createdAt = new Date(entry.createdAt);
        if (createdAt < from) {
          return false;
        }
      }

      if (toDate && entry.createdAt) {
        const to = new Date(`${toDate}T23:59:59.999Z`);
        const createdAt = new Date(entry.createdAt);
        if (createdAt > to) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      return entry.searchableText.includes(normalizedQuery);
    });

    return filtered.sort((a, b) => {
      if (sortOrder === "email") {
        return a.responderEmail.localeCompare(b.responderEmail);
      }

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sortOrder === "oldest") {
        return aTime - bTime;
      }

      return bTime - aTime;
    });
  }, [completenessFilter, emailFilter, fileFilter, fromDate, parsedEntries, query, sortOrder, toDate]);

  const stats = useMemo(() => {
    let answered = 0;
    let empty = 0;
    let withFiles = 0;
    let withoutFiles = 0;

    for (const entry of filteredEntries) {
      answered += entry.answeredCount;
      empty += entry.emptyCount;

      if (entry.hasFileValue) {
        withFiles += 1;
      } else {
        withoutFiles += 1;
      }
    }

    return {
      answered,
      empty,
      withFiles,
      withoutFiles,
      totalResponses: filteredEntries.length,
    };
  }, [filteredEntries]);

  return (
    <section className="space-y-6">
      <Card className="border-slate-200/80 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Filters and Search</CardTitle>
          <CardDescription>
            Explore response data for {formName?.trim() || "Untitled form"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search email, labels, answers"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                value={emailFilter}
                onChange={(event) => setEmailFilter(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm"
              >
                <option value="all">All responder emails</option>
                {uniqueEmails.map((email) => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <BarChart3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest" | "email")}
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm"
              >
                <option value="newest">Sort by newest</option>
                <option value="oldest">Sort by oldest</option>
                <option value="email">Sort by email</option>
              </select>
            </div>

            <div>
              <select
                value={fileFilter}
                onChange={(event) => setFileFilter(event.target.value as "all" | "with-files" | "without-files")}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All file states</option>
                <option value="with-files">With file uploads</option>
                <option value="without-files">Without file uploads</option>
              </select>
            </div>

            <div>
              <select
                value={completenessFilter}
                onChange={(event) => setCompletenessFilter(event.target.value as "all" | "complete" | "partial")}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="all">All completion states</option>
                <option value="complete">Complete responses</option>
                <option value="partial">Partial responses</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="date"
                  className="pl-9"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="date"
                  className="pl-9"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setQuery("");
                setEmailFilter("all");
                setFileFilter("all");
                setCompletenessFilter("all");
                setSortOrder("newest");
                setFromDate("");
                setToDate("");
              }}
            >
              Reset filters
            </Button>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {stats.totalResponses} responses
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PieCard
          title="Field Completion"
          description="Answered vs empty fields in filtered responses"
          slices={[
            { label: "Answered", value: stats.answered, color: "#059669" },
            { label: "Empty", value: stats.empty, color: "#dc2626" },
          ]}
        />

        <PieCard
          title="File Upload Presence"
          description="How many responses include file uploads"
          slices={[
            { label: "With files", value: stats.withFiles, color: "#0ea5e9" },
            { label: "Without files", value: stats.withoutFiles, color: "#94a3b8" },
          ]}
        />
      </div>

      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white/80">
            <CardContent className="py-10 text-center text-sm text-slate-500">
              No responses match your filters.
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.key} className="border-slate-200/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{entry.responderEmail}</CardTitle>
                <CardDescription>
                  {getReadableDateWithRelative(entry.createdAt) ?? "Timestamp unavailable"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {entry.units.length === 0 ? (
                  <p className="text-sm text-slate-500">No structured fields found in this response.</p>
                ) : (
                  entry.units.map((unit) => (
                    <div key={unit.unit_id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-900">{unit.unit_title}</p>
                      <div className="mt-2 space-y-2 text-sm">
                        {unit.fields.map((field, index) => (
                          <div key={`${unit.unit_id}-${index}`} className="flex flex-col gap-1">
                            <span className="font-medium text-slate-700">{field.label}</span>
                            {typeof field.value === "string" && (field.value.startsWith("http://") || field.value.startsWith("https://")) ? (
                              <a
                                href={field.value}
                                target="_blank"
                                rel="noreferrer"
                                className="w-fit text-sky-700 underline"
                              >
                                Open uploaded file
                              </a>
                            ) : (
                              <span className="text-slate-600">{formatFieldValue(field.value)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
