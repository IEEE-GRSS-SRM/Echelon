"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { FieldConfig } from "@/app/components/types";
import { GetField, GetMultiSelect, GetSingleSelect } from "@/app/components/form-builder/UIFactory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RespondFormClientProps = {
  formId: string;
  formName: string | null;
  formData: unknown;
};

type ParsedFormUnit = {
  id: string;
  title: string;
  fields: FieldConfig[];
};

type ResponseFieldValue = string | number | string[] | File | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeField(field: unknown): FieldConfig | null {
  if (!isRecord(field) || typeof field.type !== "string" || typeof field.label !== "string") {
    return null;
  }

  if (field.type === "file") {
    return {
      type: "file",
      label: field.label,
      description: typeof field.description === "string" ? field.description : undefined,
      acceptedTypes: Array.isArray(field.acceptedTypes)
        ? field.acceptedTypes.filter((item): item is string => typeof item === "string")
        : [],
    };
  }

  if (field.type === "text") {
    return {
      type: "text",
      label: field.label,
      placeholder: typeof field.placeholder === "string" ? field.placeholder : undefined,
    };
  }

  if (field.type === "number") {
    return {
      type: "number",
      label: field.label,
      min: typeof field.min === "number" ? field.min : undefined,
      max: typeof field.max === "number" ? field.max : undefined,
      step: typeof field.step === "number" ? field.step : undefined,
    };
  }

  if (field.type === "dropdown") {
    return {
      type: "dropdown",
      label: field.label,
      options: Array.isArray(field.options)
        ? field.options.filter((item): item is string => typeof item === "string")
        : [],
    };
  }

  if (field.type === "multiselect") {
    return {
      type: "multiselect",
      label: field.label,
      options: Array.isArray(field.options)
        ? field.options.filter((item): item is string => typeof item === "string")
        : [],
    };
  }

  return null;
}

function parsePublishedFormUnits(formData: unknown): ParsedFormUnit[] {
  let parsedData: unknown = formData;

  if (typeof parsedData === "string") {
    try {
      parsedData = JSON.parse(parsedData);
    } catch {
      parsedData = null;
    }
  }

  let unitsSource: unknown[] = [];

  if (isRecord(parsedData) && Array.isArray(parsedData.units)) {
    unitsSource = parsedData.units;
  } else if (Array.isArray(parsedData)) {
    unitsSource = parsedData;
  }

  return unitsSource
    .filter((unit) => isRecord(unit))
    .map((unit, unitIndex) => ({
      id: String(unit.id ?? `unit-${unitIndex + 1}`),
      title:
        typeof unit.title === "string" && unit.title.trim().length > 0
          ? unit.title
          : `Unit ${unitIndex + 1}`,
      fields: Array.isArray(unit.fields)
        ? unit.fields
            .map((field) => normalizeField(field))
            .filter((field): field is FieldConfig => field !== null)
        : [],
    }));
}

function getFieldKey(unitId: string, fieldIndex: number) {
  return `${unitId}:${fieldIndex}`;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getFallbackFormName(formName: string | null, formData: unknown) {
  if (typeof formName === "string" && formName.trim().length > 0) {
    return formName.trim();
  }

  if (formData && typeof formData === "object" && !Array.isArray(formData)) {
    const maybeName = (formData as Record<string, unknown>).name;
    if (typeof maybeName === "string" && maybeName.trim().length > 0) {
      return maybeName.trim();
    }
  }

  return "Untitled form";
}

export function RespondFormClient({ formId, formName, formData }: RespondFormClientProps) {
  const [responseValues, setResponseValues] = useState<Record<string, ResponseFieldValue>>({});
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState("");
  const [error, setError] = useState("");

  const formUnits = useMemo(() => parsePublishedFormUnits(formData), [formData]);

  function setResponseFieldValue(unitId: string, fieldIndex: number, value: ResponseFieldValue) {
    const key = getFieldKey(unitId, fieldIndex);
    setResponseValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmitResponse() {
    const supabase = createSupabaseBrowserClient();
    setError("");
    setResponseSuccess("");
    setIsSubmittingResponse(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to submit a response.");
        return;
      }

      const structuredResponse = [] as Array<{
        unit_id: string;
        unit_title: string;
        fields: Array<{
          label: string;
          type: FieldConfig["type"];
          value: string | number | string[] | null;
        }>;
      }>;

      for (const unit of formUnits) {
        const unitFields = [] as Array<{
          label: string;
          type: FieldConfig["type"];
          value: string | number | string[] | null;
        }>;

        for (let fieldIndex = 0; fieldIndex < unit.fields.length; fieldIndex += 1) {
          const field = unit.fields[fieldIndex];
          const fieldKey = getFieldKey(unit.id, fieldIndex);
          const rawValue = responseValues[fieldKey] ?? null;

          if (field.type === "file") {
            if (rawValue instanceof File) {
              const uploadPath = `${formId}/${user.id}/${Date.now()}-${fieldKey}-${sanitizeFileName(rawValue.name)}`;
              const { error: uploadError } = await supabase.storage
                .from("ResponseUploads")
                .upload(uploadPath, rawValue, {
                  cacheControl: "3600",
                  upsert: false,
                });

              if (uploadError) {
                setError(`Failed to upload ${field.label}: ${uploadError.message}`);
                return;
              }

              const { data: publicUrlData } = supabase.storage
                .from("ResponseUploads")
                .getPublicUrl(uploadPath);

              unitFields.push({
                label: field.label,
                type: field.type,
                value: publicUrlData.publicUrl || uploadPath,
              });
            } else {
              unitFields.push({
                label: field.label,
                type: field.type,
                value: null,
              });
            }
            continue;
          }

          if (field.type === "number") {
            unitFields.push({
              label: field.label,
              type: field.type,
              value: typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : null,
            });
            continue;
          }

          if (field.type === "multiselect") {
            unitFields.push({
              label: field.label,
              type: field.type,
              value: Array.isArray(rawValue) ? rawValue : [],
            });
            continue;
          }

          unitFields.push({
            label: field.label,
            type: field.type,
            value: typeof rawValue === "string" ? rawValue : "",
          });
        }

        structuredResponse.push({
          unit_id: unit.id,
          unit_title: unit.title,
          fields: unitFields,
        });
      }

      const responseText = JSON.stringify({
        units: structuredResponse,
      });

      const normalizedFormId = /^\d+$/.test(formId) ? Number(formId) : formId;
      const { data: updatedRows, error: updateError } = await supabase
        .from("Response")
        .update({ response: responseText })
        .eq("form_id", normalizedFormId)
        .eq("responser", user.id)
        .select("form_id");

      if (updateError) {
        setError(`Failed to save response: ${updateError.message}`);
        return;
      }

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase.from("Response").insert({
          form_id: normalizedFormId,
          responser: user.id,
          response: responseText,
        });

        if (insertError) {
          const isDuplicateConstraintError =
            insertError.code === "23505" ||
            insertError.message.toLowerCase().includes("duplicate key value");

          if (isDuplicateConstraintError) {
            const { error: retryUpdateError } = await supabase
              .from("Response")
              .update({ response: responseText })
              .eq("form_id", normalizedFormId)
              .eq("responser", user.id);

            if (retryUpdateError) {
              setError(`Failed to save response: ${retryUpdateError.message}`);
              return;
            }

            setResponseSuccess("Response submitted successfully.");
            setResponseValues({});
            return;
          }

          const isRlsInsertError = insertError.message
            .toLowerCase()
            .includes("row-level security policy");

          if (isRlsInsertError) {
            setError(
              "Failed to save response: your Response RLS insert policy is blocking inserts for this user. Keep the unique constraint and add/verify an INSERT policy with WITH CHECK (auth.uid() = responser)."
            );
            return;
          }

          setError(`Failed to save response: ${insertError.message}`);
          return;
        }
      }

      setResponseSuccess("Response submitted successfully.");
      setResponseValues({});
    } finally {
      setIsSubmittingResponse(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{getFallbackFormName(formName, formData)}</p>
      </div>

      {formUnits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
          This form has no renderable units.
        </div>
      ) : (
        <div className="space-y-4">
          {formUnits.map((unit) => (
            <div key={unit.id} className="rounded-md outline-2 outline-gray-400 p-3">
              <Label className="mb-1.5 font-black">{unit.title || "Empty Title"}</Label>
              {unit.fields.map((field, fieldIndex) => {
                const fieldKey = getFieldKey(unit.id, fieldIndex);

                return (
                  <div key={fieldKey}>
                    <hr className="my-1.5" />

                    {field.type === "file" ? (
                      <GetField
                        labelValue={field.label}
                        labelDescription={field.description}
                        element={
                          <Input
                            type="file"
                            accept={field.acceptedTypes.join(",")}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              setResponseFieldValue(unit.id, fieldIndex, file);
                            }}
                          />
                        }
                      />
                    ) : null}

                    {field.type === "text" ? (
                      <GetField
                        labelValue={field.label}
                        element={
                          <Input
                            placeholder={field.placeholder ?? "..."}
                            value={typeof responseValues[fieldKey] === "string" ? (responseValues[fieldKey] as string) : ""}
                            onChange={(event) =>
                              setResponseFieldValue(unit.id, fieldIndex, event.target.value)
                            }
                          />
                        }
                      />
                    ) : null}

                    {field.type === "number" ? (
                      <GetField
                        labelValue={field.label}
                        element={
                          <Input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={typeof responseValues[fieldKey] === "number" ? String(responseValues[fieldKey] as number) : ""}
                            onChange={(event) => {
                              if (event.target.value === "") {
                                setResponseFieldValue(unit.id, fieldIndex, null);
                                return;
                              }

                              const nextValue = Number(event.target.value);
                              setResponseFieldValue(unit.id, fieldIndex, Number.isFinite(nextValue) ? nextValue : null);
                            }}
                          />
                        }
                      />
                    ) : null}

                    {field.type === "dropdown" ? (
                      <GetField
                        labelValue={field.label}
                        element={
                          <GetSingleSelect
                            items={field.options}
                            placeholderText="Select a single thing."
                            value={typeof responseValues[fieldKey] === "string" ? (responseValues[fieldKey] as string) : ""}
                            onValueChange={(value) => setResponseFieldValue(unit.id, fieldIndex, value ?? "")}
                          />
                        }
                      />
                    ) : null}

                    {field.type === "multiselect" ? (
                      <GetField
                        labelValue={field.label}
                        element={
                          <GetMultiSelect
                            items={field.options}
                            placeholderText="Select multiple things."
                            value={Array.isArray(responseValues[fieldKey]) ? (responseValues[fieldKey] as string[]) : []}
                            onValueChange={(value) => setResponseFieldValue(unit.id, fieldIndex, value)}
                          />
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void handleSubmitResponse()}
              disabled={isSubmittingResponse}
              className="rounded-full"
            >
              {isSubmittingResponse ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit response"
              )}
            </Button>

            {responseSuccess ? (
              <p className="text-sm text-emerald-700">{responseSuccess}</p>
            ) : null}
          </div>
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}
