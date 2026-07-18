"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MOCK_QUOTATION_TEMPLATES } from "@/features/admin/data/mockQuotations";
import type { QuotationTemplate } from "@/features/admin/types";

const schema = z.object({
  name: z.string().min(2, "Template name required"),
  header: z.string().min(5, "Header required"),
  footer: z.string().min(5, "Footer required"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminQuotationsPage() {
  const [templates, setTemplates] = useState<QuotationTemplate[]>(
    MOCK_QUOTATION_TEMPLATES
  );
  const [selectedId, setSelectedId] = useState(
    MOCK_QUOTATION_TEMPLATES[0]?.id ?? ""
  );
  const [showForm, setShowForm] = useState(false);

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
    },
  });

  const headerPreview = watch("header");
  const footerPreview = watch("footer");
  const namePreview = watch("name");

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  const loadTemplate = (t: QuotationTemplate) => {
    setSelectedId(t.id);
    setShowForm(true);
    reset({
      name: t.name,
      header: t.header,
      footer: t.footer,
    });
  };

  const openCreate = () => {
    setSelectedId("");
    setShowForm(true);
    reset({
      name: "",
      header: "FlexRent — Quotation\n",
      footer: "Thank you for your business.\n",
    });
  };

  const onSubmit = (data: FormValues) => {
    if (selectedId && templates.some((t) => t.id === selectedId)) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === selectedId
            ? { ...t, name: data.name, header: data.header, footer: data.footer }
            : t
        )
      );
    } else {
      const next: QuotationTemplate = {
        id: `qt${Date.now()}`,
        name: data.name,
        header: data.header,
        footer: data.footer,
      };
      setTemplates((prev) => [next, ...prev]);
      setSelectedId(next.id);
    }
    setShowForm(false);
  };

  const previewHeader = showForm ? headerPreview : selected?.header ?? "";
  const previewFooter = showForm ? footerPreview : selected?.footer ?? "";
  const previewName = showForm
    ? namePreview || "Untitled"
    : selected?.name ?? "Quotation";

  return (
    <div>
      <PageHeader
        title="Quotation Templates"
        description="Create header and footer templates for client quotations."
        action={
          <div className="w-full sm:w-44">
            <Button type="button" onClick={openCreate}>
              + New Template
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel>
            <div className="border-b border-white/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-text">Templates</h2>
            </div>
            <ul className="divide-y divide-white/5">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => loadTemplate(t)}
                    className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm transition hover:bg-white/5 ${
                      selectedId === t.id ? "bg-accent/10 text-accent" : "text-text"
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-chalk">Edit</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {showForm && (
            <Panel className="p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-text">
                {selectedId ? "Edit template" : "New template"}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  id="qt-name"
                  label="Template name"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="qt-header"
                    className="block text-sm font-medium text-chalk"
                  >
                    Header
                  </label>
                  <textarea
                    id="qt-header"
                    rows={4}
                    className={`w-full rounded-lg border bg-surface px-4 py-3 text-sm text-text placeholder-chalk focus:outline-none focus:ring-1 ${
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
                  <label
                    htmlFor="qt-footer"
                    className="block text-sm font-medium text-chalk"
                  >
                    Footer
                  </label>
                  <textarea
                    id="qt-footer"
                    rows={4}
                    className={`w-full rounded-lg border bg-surface px-4 py-3 text-sm text-text placeholder-chalk focus:outline-none focus:ring-1 ${
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
                <div className="flex gap-3">
                  <div className="w-40">
                    <Button type="submit">Save template</Button>
                  </div>
                  <div className="w-28">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </Panel>
          )}
        </div>

        <Panel className="p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-text">
            Live preview
          </h2>
          <div className="rounded-lg border border-white/10 bg-surface p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-accent">
              {previewName}
            </p>
            <div className="mb-6 whitespace-pre-wrap border-b border-white/10 pb-4 text-sm text-text">
              {previewHeader || "Header will appear here…"}
            </div>
            <div className="mb-6 space-y-2 text-sm text-chalk">
              <p>Item: Canon EOS R6 × 3 days</p>
              <p>Subtotal: ₹3,600</p>
              <p>Deposit: ₹5,000</p>
              <p className="font-medium text-text">Total: ₹8,600</p>
            </div>
            <div className="whitespace-pre-wrap border-t border-white/10 pt-4 text-sm text-chalk">
              {previewFooter || "Footer will appear here…"}
            </div>
          </div>
          {!showForm && selected && (
            <button
              type="button"
              className="mt-4 text-sm text-accent hover:underline"
              onClick={() => {
                setValue("name", selected.name);
                setValue("header", selected.header);
                setValue("footer", selected.footer);
                loadTemplate(selected);
              }}
            >
              Edit this template
            </button>
          )}
        </Panel>
      </div>
    </div>
  );
}
