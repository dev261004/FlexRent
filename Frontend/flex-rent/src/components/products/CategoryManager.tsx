"use client";

import { useEffect, useState } from "react";
import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { Panel } from "@/components/admin/Panel";
import { createCategory, deleteCategory, listCategoriesLive, updateCategory } from "@/features/categories/api";
import type { Category } from "@/features/products/api";

const emptyForm = { name: "", description: "" };

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    listCategoriesLive()
      .then(setCategories)
      .catch(() => setError("Could not load categories."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Category name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateCategory(editingId, {
          name: form.name.trim(),
          description: form.description.trim() || null,
        });
      } else {
        await createCategory({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
      }
      resetForm();
      load();
    } catch {
      setError("Could not save category.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this category? Products linked to it will become uncategorized.")) return;
    setSaving(true);
    setError("");
    try {
      await deleteCategory(id);
      load();
    } catch {
      setError("Could not delete category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel className="mt-8 overflow-hidden">
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 className="font-display text-lg font-semibold text-text">Product categories</h2>
        <p className="mt-1 text-sm text-chalk">Manage the category dropdown used while adding or editing products.</p>
      </div>

      {error && <p className="mx-5 mt-4 rounded-xl bg-danger/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p>}

      <form onSubmit={submit} className="grid gap-3 border-b border-border p-5 sm:grid-cols-[1fr_1fr_auto] sm:p-6">
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Category name"
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
        />
        <input
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Description"
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
        />
        <div className="flex gap-2">
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-black disabled:opacity-60">
            {editingId ? <Save size={16} /> : <Plus size={16} />}
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-xl border border-border p-2.5 text-chalk hover:text-text" aria-label="Cancel edit">
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
              <th className="px-5 py-3.5 font-semibold sm:px-6">Name</th>
              <th className="px-5 py-3.5 font-semibold">Description</th>
              <th className="px-5 py-3.5 font-semibold sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="p-8 text-center text-chalk">Loading categories...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={3} className="p-8 text-center text-chalk">No categories found.</td></tr>
            ) : categories.map((category) => (
              <tr key={category.id} className="border-t border-border/60">
                <td className="px-5 py-4 font-semibold text-text sm:px-6">{category.name}</td>
                <td className="px-5 py-4 text-chalk">{category.description ?? "-"}</td>
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(category.id);
                        setForm({ name: category.name, description: category.description ?? "" });
                      }}
                      className="rounded-lg border border-border p-2 text-chalk hover:border-accent hover:text-text"
                      aria-label="Edit category"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button type="button" onClick={() => void remove(category.id)} className="rounded-lg border border-red-500/30 p-2 text-red-600 hover:bg-red-500/10" aria-label="Delete category">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
