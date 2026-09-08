"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  FileText,
  Star,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getQuotationTemplates,
  createQuotationTemplate,
  updateQuotationTemplate,
  deleteQuotationTemplate,
  setDefaultQuotationTemplate,
} from "@/features/admin/api";
import type { QuotationTemplate } from "@/features/admin/types";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Template name must be at least 2 characters")
    .max(100, "Template name cannot exceed 100 characters"),
  header: z
    .string()
    .trim()
    .min(3, "Header is required (min 3 characters)")
    .max(2000, "Header cannot exceed 2000 characters"),
  footer: z
    .string()
    .trim()
    .min(3, "Footer is required (min 3 characters)")
    .max(2000, "Footer cannot exceed 2000 characters"),
  validityDays: z.coerce
    .number()
    .min(1, "Validity must be at least 1 day")
    .max(365, "Validity cannot exceed 365 days"),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

export default function AdminQuotationsPage() {
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      header: "",
      footer: "",
      validityDays: 30,
      isDefault: false,
      isActive: true,
    },
  });

  const headerPreview = watch("header");
  const footerPreview = watch("footer");
  const namePreview = watch("name");
  const validityPreview = watch("validityDays");

  // Fetch templates from backend
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getQuotationTemplates();
      const tpls = res?.quotationTemplates || [];
      setTemplates(tpls);
      if (tpls.length > 0) {
        if (!selectedId || !tpls.some((t) => t.id === selectedId)) {
          const defaultTpl = tpls.find((t) => t.isDefault) ?? tpls[0];
          setSelectedId(defaultTpl ? defaultTpl.id : "");
        }
      } else {
        setSelectedId("");
      }
    } catch {
      toast.error("Failed to load quotation templates");
      setTemplates([]);
      setSelectedId("");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.header.toLowerCase().includes(q) ||
        t.footer.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const selected = useMemo(() => {
    return templates.find((t) => t.id === selectedId) ?? templates[0];
  }, [templates, selectedId]);

  const loadTemplateForEdit = (t: QuotationTemplate) => {
    setSelectedId(t.id);
    setShowForm(true);
    reset({
      name: t.name,
      header: t.header,
      footer: t.footer,
      validityDays: t.validityDays ?? 30,
      isDefault: Boolean(t.isDefault),
      isActive: t.isActive !== false,
    });
  };

  const openCreate = () => {
    setSelectedId("");
    setShowForm(true);
    reset({
      name: "",
      header: "FlexRent — Premium Equipment Quotation\nCustomer: [Client Name]\nDate: [Current Date]",
      footer: "Validity: 30 Days from issuance.\nTerms: Subject to equipment availability and security deposit clearance.\nThank you for choosing FlexRent!",
      validityDays: 30,
      isDefault: templates.length === 0,
      isActive: true,
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      if (selectedId && templates.some((t) => t.id === selectedId)) {
        // Update existing template
        const updated = await updateQuotationTemplate(selectedId, {
          name: data.name,
          header: data.header,
          footer: data.footer,
          validityDays: data.validityDays,
          isDefault: data.isDefault,
          isActive: data.isActive,
        });

        toast.success("Quotation template updated successfully!");
        setTemplates((prev) =>
          prev.map((t) => {
            if (t.id === selectedId) return updated;
            if (data.isDefault) return { ...t, isDefault: false };
            return t;
          })
        );
      } else {
        // Create new template
        const created = await createQuotationTemplate({
          name: data.name,
          header: data.header,
          footer: data.footer,
          validityDays: data.validityDays,
          isDefault: data.isDefault,
          isActive: data.isActive,
        });

        toast.success("New quotation template created!");
        setTemplates((prev) => {
          const nextList = data.isDefault
            ? prev.map((t) => ({ ...t, isDefault: false }))
            : [...prev];
          return [created, ...nextList];
        });
        setSelectedId(created.id);
      }
      setShowForm(false);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save quotation template";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (t: QuotationTemplate) => {
    if (t.isDefault) return;
    try {
      setIsSettingDefault(true);
      await setDefaultQuotationTemplate(t.id);
      toast.success(`"${t.name}" set as default quotation template!`);
      setTemplates((prev) =>
        prev.map((item) => ({
          ...item,
          isDefault: item.id === t.id,
        }))
      );
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to set default template";
      toast.error(errorMsg);
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleDelete = async (t: QuotationTemplate) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${t.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await deleteQuotationTemplate(t.id);
      toast.success(`Template "${t.name}" deleted successfully`);
      setTemplates((prev) => {
        const remaining = prev.filter((item) => item.id !== t.id);
        if (remaining.length > 0 && selectedId === t.id) {
          setSelectedId(remaining[0].id);
        }
        return remaining;
      });
      if (showForm && selectedId === t.id) {
        setShowForm(false);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to delete template";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const previewHeader = showForm ? headerPreview : selected?.header ?? "";
  const previewFooter = showForm ? footerPreview : selected?.footer ?? "";
  const previewName = showForm
    ? namePreview || "Untitled Template"
    : selected?.name ?? "Quotation Template";
  const previewValidity = showForm
    ? validityPreview || 30
    : selected?.validityDays ?? 30;

  return (
    <div>
      <PageHeader
        title="Quotation Templates"
        description="Design and manage standardized headers, footers, and validity rules for rapid quotation generation."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchTemplates}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface px-3 py-2 text-xs font-semibold text-chalk transition hover:bg-white/5 hover:text-text"
              title="Refresh templates"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-accent" : ""}`} />
              <span>Refresh</span>
            </button>
            <div className="w-full sm:w-44">
              <Button type="button" onClick={openCreate} className="flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                <span>New Template</span>
              </Button>
            </div>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: Template list & form */}
        <div className="space-y-4 lg:col-span-5 xl:col-span-5">
          {/* Templates list panel */}
          <Panel>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-text">Templates</h2>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-chalk">
                  {templates.length}
                </span>
              </div>
            </div>

            {/* Search filter */}
            <div className="border-b border-white/5 px-4 py-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-chalk" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-surface/50 py-1.5 pl-8 pr-3 text-xs text-text placeholder-chalk/70 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {isLoading && templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-chalk">
                <RefreshCw className="mb-2 h-6 w-6 animate-spin text-accent" />
                <p className="text-xs">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-10 text-center text-xs text-chalk px-4">
                {searchQuery
                  ? "No templates found matching your search."
                  : "No quotation templates yet. Click \"New Template\" above to create one."}
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {filteredTemplates.map((t) => {
                  const isSelected = selectedId === t.id;
                  return (
                    <li key={t.id} className="transition">
                      <div
                        className={`group flex w-full items-center justify-between px-4 py-3 text-left transition ${
                          isSelected
                            ? "bg-accent/10 border-l-2 border-accent"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(t.id);
                            if (showForm) {
                              loadTemplateForEdit(t);
                            }
                          }}
                          className="flex flex-1 flex-col pr-2 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? "text-accent" : "text-text"
                              }`}
                            >
                              {t.name}
                            </span>
                            {t.isDefault && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                                <Star className="h-2.5 w-2.5 fill-amber-400" />
                                Default
                              </span>
                            )}
                            {t.isActive === false && (
                              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-chalk">
                                Inactive
                              </span>
                            )}
                          </div>
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-chalk">
                            <Clock className="h-3 w-3" />
                            Valid: {t.validityDays ?? 30} days
                          </span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => loadTemplateForEdit(t)}
                            className="rounded-lg p-1.5 text-chalk transition hover:bg-white/10 hover:text-text"
                            title="Edit template"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {!t.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(t)}
                              disabled={isSettingDefault}
                              className="rounded-lg p-1.5 text-chalk transition hover:bg-white/10 hover:text-amber-400"
                              title="Set as default template"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {templates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDelete(t)}
                              disabled={isDeleting}
                              className="rounded-lg p-1.5 text-chalk transition hover:bg-danger/20 hover:text-danger"
                              title="Delete template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Create / Edit Form Modal/Drawer Panel */}
          {showForm && (
            <Panel className="p-5 border-accent/30 shadow-[0_0_25px_rgba(200,100,50,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="font-display text-base font-semibold text-text">
                    {selectedId ? "Edit Quotation Template" : "New Quotation Template"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-chalk hover:text-text"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  id="qt-name"
                  label="Template Name"
                  placeholder="e.g. Standard Quotation, Event Package"
                  error={errors.name?.message}
                  {...register("name")}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="qt-validity"
                    label="Validity (Days)"
                    type="number"
                    min={1}
                    max={365}
                    error={errors.validityDays?.message}
                    {...register("validityDays")}
                  />

                  <div className="flex flex-col justify-end space-y-2 pb-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-surface text-accent focus:ring-accent"
                        {...register("isDefault")}
                      />
                      <span>Make Default</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-surface text-accent focus:ring-accent"
                        {...register("isActive")}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="qt-header"
                      className="block text-xs font-medium text-chalk"
                    >
                      Quotation Header (Letterhead / Greeting)
                    </label>
                    <span className="text-[10px] text-chalk/60">
                      {headerPreview?.length ?? 0}/2000
                    </span>
                  </div>
                  <textarea
                    id="qt-header"
                    rows={4}
                    placeholder="Enter header letterhead or greeting notes..."
                    className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-xs text-text placeholder-chalk/50 focus:outline-none focus:ring-1 ${
                      errors.header
                        ? "border-danger focus:border-danger focus:ring-danger"
                        : "border-white/10 focus:border-accent focus:ring-accent"
                    }`}
                    {...register("header")}
                  />
                  {errors.header && (
                    <p className="text-xs text-danger">{errors.header.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="qt-footer"
                      className="block text-xs font-medium text-chalk"
                    >
                      Quotation Footer (Terms & Payment Instructions)
                    </label>
                    <span className="text-[10px] text-chalk/60">
                      {footerPreview?.length ?? 0}/2000
                    </span>
                  </div>
                  <textarea
                    id="qt-footer"
                    rows={4}
                    placeholder="Enter validity terms, bank details, or sign-off message..."
                    className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-xs text-text placeholder-chalk/50 focus:outline-none focus:ring-1 ${
                      errors.footer
                        ? "border-danger focus:border-danger focus:ring-danger"
                        : "border-white/10 focus:border-accent focus:ring-accent"
                    }`}
                    {...register("footer")}
                  />
                  {errors.footer && (
                    <p className="text-xs text-danger">{errors.footer.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <div className="flex-1">
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? "Saving..." : "Save Template"}
                    </Button>
                  </div>
                  <div className="w-24">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowForm(false)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </Panel>
          )}
        </div>

        {/* Right column: Live Interactive Preview */}
        <div className="space-y-4 lg:col-span-7 xl:col-span-7">
          <Panel className="p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-text flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Live Quotation Preview
                </h2>
                <p className="text-xs text-chalk">
                  Real-time visualization of how the customer will see this quotation document.
                </p>
              </div>

              {selected && !showForm && (
                <div className="flex items-center gap-2">
                  {!selected.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(selected)}
                      disabled={isSettingDefault}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs font-semibold text-chalk hover:text-text hover:bg-white/5 transition"
                    >
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setValue("name", selected.name);
                      setValue("header", selected.header);
                      setValue("footer", selected.footer);
                      setValue("validityDays", selected.validityDays ?? 30);
                      setValue("isDefault", Boolean(selected.isDefault));
                      setValue("isActive", selected.isActive !== false);
                      loadTemplateForEdit(selected);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Template
                  </button>
                </div>
              )}
            </div>

            {/* Document sheet styled preview */}
            <div className="rounded-xl border border-white/10 bg-surface p-6 shadow-xl space-y-6">
              {/* Document Header Bar */}
              <div className="flex items-start justify-between border-b border-white/10 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl font-bold tracking-tight text-text">
                      FlexRent
                    </span>
                    <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                      Rental Quotation
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-chalk">
                    Template: <span className="font-medium text-text">{previewName}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-mono text-chalk">
                    QUOTE-{new Date().getFullYear()}-0084
                  </span>
                  <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-chalk">
                    <Clock className="h-3 w-3" />
                    Validity: {previewValidity} Days
                  </p>
                </div>
              </div>

              {/* Template Dynamic Header */}
              <div className="rounded-lg bg-surface-raised/40 p-4 border border-white/5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-accent/80">
                  Header Note & Greeting
                </p>
                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-text">
                  {previewHeader || (
                    <span className="italic text-chalk/50">Header will appear here...</span>
                  )}
                </div>
              </div>

              {/* Sample Quotation Line Items Table */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-chalk">
                  Quotation Line Items (Sample)
                </p>
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-white/5 text-[11px] text-chalk">
                      <tr>
                        <th className="px-3.5 py-2 font-medium">Item & Description</th>
                        <th className="px-3.5 py-2 font-medium text-center">Duration</th>
                        <th className="px-3.5 py-2 font-medium text-right">Daily Rate</th>
                        <th className="px-3.5 py-2 font-medium text-right">Deposit</th>
                        <th className="px-3.5 py-2 font-medium text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-text">
                      <tr>
                        <td className="px-3.5 py-2.5">
                          <span className="font-medium">Sony Alpha A7 IV Camera</span>
                          <p className="text-[10px] text-chalk">Standard 4K Kit with 28-70mm lens</p>
                        </td>
                        <td className="px-3.5 py-2.5 text-center text-chalk">3 Days</td>
                        <td className="px-3.5 py-2.5 text-right font-mono">₹1,800</td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-amber-400">₹8,000</td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium">₹5,400</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-2.5">
                          <span className="font-medium">Godox AD200 Pro Strobe</span>
                          <p className="text-[10px] text-chalk">Portable TTL flash unit</p>
                        </td>
                        <td className="px-3.5 py-2.5 text-center text-chalk">3 Days</td>
                        <td className="px-3.5 py-2.5 text-right font-mono">₹600</td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-amber-400">₹3,000</td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-medium">₹1,800</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 rounded-lg bg-surface-raised/40 p-3 text-xs border border-white/5">
                    <div className="flex justify-between text-chalk">
                      <span>Rental Subtotal:</span>
                      <span className="font-mono">₹7,200</span>
                    </div>
                    <div className="flex justify-between text-chalk">
                      <span>Security Deposit:</span>
                      <span className="font-mono text-amber-400">₹11,000</span>
                    </div>
                    <div className="flex justify-between text-chalk">
                      <span>Estimated Taxes (18%):</span>
                      <span className="font-mono">₹1,296</span>
                    </div>
                    <div className="border-t border-white/10 pt-1.5 flex justify-between font-medium text-text">
                      <span>Total Payable:</span>
                      <span className="font-mono text-sm text-accent">₹19,496</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Dynamic Footer */}
              <div className="rounded-lg bg-surface-raised/40 p-4 border border-white/5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-accent/80">
                  Footer Terms & Conditions
                </p>
                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-chalk">
                  {previewFooter || (
                    <span className="italic text-chalk/50">Footer will appear here...</span>
                  )}
                </div>
              </div>

              {/* Template Metadata Footer */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-chalk/70">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Generated via FlexRent Quotation Engine
                </span>
                <span>Valid for {previewValidity} days from delivery</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
