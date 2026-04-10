"use client";

import { FieldConfig, FormUnitInstance, FormUnitRef } from "../types";
import FormElementsChooser from "./FormElementsChooser";
import React, { useEffect, useState } from "react";
import { GetFormUnit } from "./UIFactory";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  SidebarProvider
} from "@/components/ui/sidebar"
import { GripVertical, Plus, Trash2, Save, ArrowLeft, Check } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"

import "./styles.css";

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

function parseStoredFormData(rawFormData: unknown) {
  let parsedData: unknown = rawFormData;

  if (typeof parsedData === "string") {
    try {
      parsedData = JSON.parse(parsedData);
    } catch {
      parsedData = null;
    }
  }

  let unitsSource: unknown[] = [];
  let parsedName = "";

  if (isRecord(parsedData)) {
    if (typeof parsedData.name === "string") {
      parsedName = parsedData.name;
    }

    if (Array.isArray(parsedData.units)) {
      unitsSource = parsedData.units;
    }
  } else if (Array.isArray(parsedData)) {
    // Legacy shape: form_data stored directly as an array of units.
    unitsSource = parsedData;
  }

  const hydratedUnits: FormUnitInstance[] = unitsSource
    .filter((unit) => isRecord(unit))
    .map((unit, index) => {
      const normalizedFields = Array.isArray(unit.fields)
        ? unit.fields
            .map((field) => normalizeField(field))
            .filter((field): field is FieldConfig => field !== null)
        : [];

      return {
        id: typeof unit.id === "number" ? unit.id : Date.now() + index,
        title: typeof unit.title === "string" ? unit.title : `Unit ${index + 1}`,
        fields: normalizedFields,
        ref: React.createRef<FormUnitRef>(),
      };
    });

  return { parsedName, hydratedUnits };
}

function FormBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");
  const [addingFormElement, setAddingFormElement] = useState(false);
  const [formUnits, setFormUnits] = useState<FormUnitInstance[]>([]);
  const [draggedUnitId, setDraggedUnitId] = useState<number | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExistingForm, setIsLoadingExistingForm] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadExistingForm = async () => {
      if (!formId) {
        setEditingFormId(null);
        setFormName("");
        setFormUnits([]);
        setIsLoadingExistingForm(false);
        return;
      }

      setIsLoadingExistingForm(true);

      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          alert("You must be logged in to edit a form");
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("Forms")
          .select("id, form_name, form_data")
          .eq("id", formId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error || !data) {
          alert("Could not load this form for editing");
          router.push("/dashboard/forms");
          return;
        }

        const { parsedName, hydratedUnits } = parseStoredFormData(data.form_data);

        if (!isCancelled) {
          setEditingFormId(String(data.id));
          setFormName(data.form_name ?? parsedName);
          setFormUnits(hydratedUnits);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingExistingForm(false);
        }
      }
    };

    void loadExistingForm();

    return () => {
      isCancelled = true;
    };
  }, [formId, router]);

  const handleDeleteFormUnit = (unitId: number) => {
    setFormUnits((currentUnits) => currentUnits.filter((unit) => unit.id !== unitId));
  };

  const handleDragStart = (unitId: number) => {
    setDraggedUnitId(unitId);
  };

  const handleDrop = (targetUnitId: number) => {
    if (draggedUnitId === null || draggedUnitId === targetUnitId) {
      setDraggedUnitId(null);
      return;
    }

    setFormUnits((currentUnits) => {
      const sourceIndex = currentUnits.findIndex((unit) => unit.id === draggedUnitId);
      const targetIndex = currentUnits.findIndex((unit) => unit.id === targetUnitId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return currentUnits;
      }

      const nextUnits = [...currentUnits];
      const [movedUnit] = nextUnits.splice(sourceIndex, 1);
      nextUnits.splice(targetIndex, 0, movedUnit);
      return nextUnits;
    });

    setDraggedUnitId(null);
  };

  const handleSaveForm = async () => {
    if (!formName.trim()) {
      alert("Please enter a form name");
      return;
    }

    if (formUnits.length === 0) {
      alert("Please add at least one form unit");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to save a form");
        return;
      }

      const formData = {
        name: formName,
        units: formUnits.map((unit) => ({
          id: unit.id,
          title: unit.title,
          fields: unit.fields,
        })),
      };

      if (editingFormId) {
        const { error } = await supabase
          .from("Forms")
          .update({
            form_name: formName,
            form_data: formData,
          })
          .eq("id", editingFormId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error saving form:", error);
          alert("Failed to save form: " + error.message);
          return;
        }
      } else {
        const { data: insertedRow, error } = await supabase
          .from("Forms")
          .insert([
            {
              user_id: user.id,
              form_name: formName,
              form_data: formData,
            },
          ])
          .select("id")
          .single();

        if (error) {
          console.error("Error saving form:", error);
          alert("Failed to save form: " + error.message);
          return;
        }

        if (insertedRow?.id != null) {
          const newFormId = String(insertedRow.id);
          setEditingFormId(newFormId);
          router.replace(`/components/form-builder?formId=${newFormId}`);
        }
      }

      setShowSuccessIndicator(true);
    } catch (error) {
      console.error("Error saving form:", error);
      alert("An error occurred while saving the form");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!showSuccessIndicator) return;

    const timer = setTimeout(() => {
      setShowSuccessIndicator(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [showSuccessIndicator]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSaveCombo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";

      if (!isSaveCombo) {
        return;
      }

      event.preventDefault();

      if (!isSaving && !isLoadingExistingForm) {
        void handleSaveForm();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isLoadingExistingForm, isSaving, handleSaveForm]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">

        {/* Sidebar */}
        <Sidebar className="border-r border-sidebar-border/60">
          <SidebarHeader className="gap-4 border-b border-sidebar-border/60 px-4 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Workspace
                </p>
                <h1 className="text-base font-semibold leading-none">
                  {editingFormId ? "Edit Form" : "Form Builder"}
                </h1>
                <p className="text-sm leading-5 text-muted-foreground">
                  {editingFormId
                    ? "Edit this form and save to overwrite the existing record."
                    : "Create form sections and organize them on the canvas."}
                </p>
              </div>

              <SidebarTrigger className="shrink-0 rounded-full border border-sidebar-border/70 bg-background shadow-sm" />
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-3">
            <SidebarGroup>
              <SidebarGroupLabel>Actions</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="h-10 rounded-xl px-3"
                      onClick={() => setAddingFormElement(true)}
                    >
                      <Plus className="size-4" />
                      <span>Add form unit</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="mx-4 my-2" />

            <SidebarGroup>
              <SidebarGroupLabel>Canvas</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">Form units</span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {formUnits.length}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Open the chooser to add a new unit. Existing units stay visible in the main canvas.
                  </p>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border/60 px-4 py-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Form Name</label>
              <Input
                placeholder="Enter form name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-9"
              />
            </div>
            <Button
              onClick={handleSaveForm}
              disabled={isSaving || isLoadingExistingForm}
              className="w-full h-10 rounded-xl"
            >
              <Save className="size-4 mr-2" />
              {isLoadingExistingForm
                ? "Loading..."
                : isSaving
                  ? "Saving..."
                  : editingFormId
                    ? "Update Form"
                    : "Save Form"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 rounded-xl"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="size-4 mr-2" />
              Back to dashboard
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* MAIN CANVAS */}
        <main className="w-full h-full overflow-hidden relative">
          {showSuccessIndicator && (
            <div className="fixed top-4 right-4 z-50">
              <div className="animate-pulse">
                <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 backdrop-blur-sm border border-green-500/30">
                  <Check className="size-5 text-green-600" />
                </div>
              </div>
            </div>
          )}
          <ScrollArea className="h-full w-full">

            {addingFormElement && (
              <FormElementsChooser
                setFormUnits={setFormUnits}
                setAddingFormElement={setAddingFormElement}
              />
            )}

            <div className="space-y-4 p-5">
              {isLoadingExistingForm ? (
                <div className="rounded-2xl border border-border/70 bg-card/60 px-6 py-10 text-center text-sm text-muted-foreground shadow-sm">
                  Loading form...
                </div>
              ) : formUnits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-card/60 px-6 py-10 text-center text-sm text-muted-foreground shadow-sm">
                  {editingFormId
                    ? "This form has no units yet. Use the sidebar to add one."
                    : "No sections added yet. Use the sidebar to add your first section."}
                </div>
              ) : (
                formUnits.map((unit) => (
                  <div
                    key={unit.id}
                    draggable
                    onDragStart={() => handleDragStart(unit.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(unit.id)}
                    onDragEnd={() => setDraggedUnitId(null)}
                    className={`group relative rounded-2xl border border-border/70 bg-card p-4 pt-12 shadow-sm transition-all ${
                      draggedUnitId === unit.id ? "opacity-60 ring-2 ring-ring/40" : ""
                    }`}
                  >
                    <div className="absolute left-3 top-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <GripVertical className="size-4" />
                      <span className="select-none">Drag to reorder</span>
                    </div>

                    <div className="absolute right-3 top-3 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="shadow-sm"
                        onClick={() => handleDeleteFormUnit(unit.id)}
                        aria-label={`Delete ${unit.title || "form unit"}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <GetFormUnit
                      ref={unit.ref}
                      title={unit.title}
                      fields={unit.fields}
                    />
                  </div>
                ))
              )}
            </div>

          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function FormBuilderPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading form builder...</div>}>
      <FormBuilderContent />
    </React.Suspense>
  );
}
