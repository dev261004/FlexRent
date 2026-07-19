"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Archive,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ImagePlus,
  PackageSearch,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import {
  archiveProduct,
  createProduct,
  deleteProductImage,
  getProduct,
  listCategories,
  listProductImages,
  listProducts,
  setPrimaryProductImage,
  updateProduct,
  uploadProductImages,
  type Category,
  type Product,
  type ProductPayload,
  type ProductStatus,
  type ProductType,
} from "@/features/products/api";

type ProductForm = {
  name: string;
  sku: string;
  description: string;
  type: ProductType;
  status: ProductStatus;
  quantityOnHand: string;
  salesPrice: string;
  costPrice: string;
  categoryId: string;
};

const initialForm: ProductForm = {
  name: "",
  sku: "",
  description: "",
  type: "GOODS",
  status: "ACTIVE",
  quantityOnHand: "1",
  salesPrice: "",
  costPrice: "",
  categoryId: "",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api$/, "");

function getImageUrl(url: string | undefined | null) {
  if (!url) return fallbackImage;
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
}

export function ProductManager({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<Product["images"]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [imageBusy, setImageBusy] = useState(false);

  const loadProducts = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const data = await listProducts({ page, limit: 10, search, status: status || undefined });
        setProducts(data.products);
        setPagination(data.pagination);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to fetch products"));
      } finally {
        setLoading(false);
      }
    },
    [search, status]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProducts(1), 250);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const action = (
    <button
      type="button"
      onClick={() => openCreateForm()}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
    >
      <Plus size={18} /> Add product
    </button>
  );

  const selectedImageIds = useMemo(() => images?.map((image) => image.id).join(",") ?? "", [images]);

  async function openEditForm(productId: string) {
    try {
      setSaving(true);
      const product = await getProduct(productId);
      setEditingProduct(product);
      setProductImageFiles([]);
      setForm({
        name: product.name,
        sku: product.sku ?? "",
        description: product.description ?? "",
        type: product.type,
        status: product.status,
        quantityOnHand: String(product.quantityOnHand),
        salesPrice: String(product.salesPrice),
        costPrice: product.costPrice ?? "",
        categoryId: product.categoryId ?? "",
      });
      setFormOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load product"));
    } finally {
      setSaving(false);
    }
  }

  function openCreateForm() {
    setEditingProduct(null);
    setForm(initialForm);
    setProductImageFiles([]);
    setFormOpen(true);
  }

  async function submitProduct(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = toPayload(form);
      let savedProduct: Product;
      if (editingProduct) {
        savedProduct = await updateProduct(editingProduct.id, payload);
        if (productImageFiles.length > 0) {
          await uploadProductImages(savedProduct.id, productImageFiles);
        }
        toast.success("Product updated successfully.");
      } else {
        savedProduct = await createProduct(payload);
        if (productImageFiles.length > 0) {
          await uploadProductImages(savedProduct.id, productImageFiles);
        }
        toast.success("Product created successfully.");
      }
      setFormOpen(false);
      setProductImageFiles([]);
      await loadProducts(editingProduct ? pagination.page : 1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save product"));
      setFormOpen(false);
      setProductImageFiles([]);
    } finally {
      setSaving(false);
    }
  }

  async function archive(id: string) {
    if (!window.confirm("Archive this product?")) return;
    try {
      setSaving(true);
      await archiveProduct(id);
      toast.success("Product archived.");
      await loadProducts(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to archive product"));
    } finally {
      setSaving(false);
    }
  }

  async function openImages(product: Product) {
    setSelectedProduct(product);
    setImages(undefined);
    setImageFiles([]);
    try {
      setImageBusy(true);
      setImages(await listProductImages(product.id));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load product images"));
      setImages([]);
    } finally {
      setImageBusy(false);
    }
  }

  async function uploadImages() {
    if (!selectedProduct || imageFiles.length === 0) return;
    try {
      setImageBusy(true);
      await uploadProductImages(selectedProduct.id, imageFiles);
      setImageFiles([]);
      setImages(await listProductImages(selectedProduct.id));
      await loadProducts(pagination.page);
      toast.success("Images uploaded.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload images"));
    } finally {
      setImageBusy(false);
    }
  }

  function addProductImageFiles(files: FileList | null) {
    if (!files) return;
    const fileArray = Array.from(files);
    setProductImageFiles((current) => [...current, ...fileArray]);
  }

  function removeProductImageFile(index: number) {
    setProductImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function makePrimary(imageId: string) {
    if (!selectedProduct) return;
    try {
      setImageBusy(true);
      await setPrimaryProductImage(imageId);
      setImages(await listProductImages(selectedProduct.id));
      await loadProducts(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to set primary image"));
    } finally {
      setImageBusy(false);
    }
  }

  async function removeImage(imageId: string) {
    if (!selectedProduct || !window.confirm("Delete this image?")) return;
    try {
      setImageBusy(true);
      await deleteProductImage(imageId);
      setImages(await listProductImages(selectedProduct.id));
      await loadProducts(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete image"));
    } finally {
      setImageBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title={title} description={description} action={action} />

      <Panel className="mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, SKUs, categories"
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus | "")}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            type="button"
            onClick={() => void loadProducts(pagination.page)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text hover:border-accent disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-text">Product catalog</h2>
            <p className="mt-1 text-sm text-chalk">
              {pagination.total} product{pagination.total === 1 ? "" : "s"} found.
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-chalk">
            Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-accent/15 p-4 text-accent">
              <PackageSearch size={28} />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-text">No products found</h3>
            <p className="mt-1 max-w-sm text-sm text-chalk">Create a product to start building the rental catalog.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Product</th>
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 font-semibold">Vendor</th>
                  <th className="px-5 py-3.5 font-semibold">Stock</th>
                  <th className="px-5 py-3.5 font-semibold">Price</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-border/60 transition hover:bg-accent/[0.035]">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(product.primaryImage?.url)}
                          alt={product.primaryImage?.altText ?? product.name}
                          className="h-12 w-14 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold text-text">{product.name}</p>
                          <p className="mt-0.5 font-mono text-xs text-chalk">{product.sku ?? "No SKU"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-chalk">{product.category?.name ?? "Uncategorized"}</td>
                    <td className="px-5 py-4 text-chalk">{product.vendor?.companyName ?? product.vendor?.fullName ?? "-"}</td>
                    <td className="px-5 py-4 font-semibold text-text">{product.quantityOnHand}</td>
                    <td className="px-5 py-4 font-semibold text-text">{formatMoney(product.salesPrice)}</td>
                    <td className="px-5 py-4"><StatusBadge status={product.status} /></td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex flex-wrap gap-2">
                        <IconButton label="Edit product" onClick={() => void openEditForm(product.id)} icon={<Edit3 size={15} />} />
                        <IconButton label="Manage images" onClick={() => void openImages(product)} icon={<Camera size={15} />} />
                        {product.status !== "ARCHIVED" && (
                          <IconButton label="Archive product" onClick={() => void archive(product.id)} icon={<Archive size={15} />} danger />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-5 py-4 sm:px-6">
          <p className="text-sm text-chalk">Showing page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous page" onClick={() => void loadProducts(pagination.page - 1)} disabled={loading || pagination.page <= 1} className="rounded-lg border border-border p-2 text-chalk transition hover:border-accent/50 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={18} /></button>
            <button type="button" aria-label="Next page" onClick={() => void loadProducts(pagination.page + 1)} disabled={loading || pagination.page >= pagination.totalPages} className="rounded-lg border border-border p-2 text-chalk transition hover:border-accent/50 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={18} /></button>
          </div>
        </div>
      </Panel>

      {formOpen && (
        <Modal title={editingProduct ? "Edit product" : "Create product"} onClose={() => setFormOpen(false)}>
          <form onSubmit={submitProduct} className="grid gap-4">
            <label className="text-sm font-semibold text-text">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-text">SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
              <label className="text-sm font-semibold text-text">Category<select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            </div>
            <label className="text-sm font-semibold text-text">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-text">Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ProductType })} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"><option value="GOODS">Goods</option><option value="SERVICE">Service</option></select></label>
              <label className="text-sm font-semibold text-text">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-semibold text-text">Stock<input required min={0} type="number" value={form.quantityOnHand} onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
              <label className="text-sm font-semibold text-text">Sales price<input required min={11} step="0.01" type="number" value={form.salesPrice} onChange={(e) => setForm({ ...form, salesPrice: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
              <label className="text-sm font-semibold text-text">Cost price<input min={11} step="0.01" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-black/[0.02] p-4 dark:bg-white/[0.02]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">Product images</p>
                  <p className="mt-1 text-xs text-chalk">Select one or more images. Preview appears before saving.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm font-bold text-text transition hover:border-accent hover:text-accent">
                  <ImagePlus size={16} />
                  Choose images
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={(event) => {
                      addProductImageFiles(event.target.files);
                      event.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {productImageFiles.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {productImageFiles.map((file, index) => (
                    <PendingImagePreview
                      key={`${file.name}-${file.lastModified}-${index}`}
                      file={file}
                      onRemove={() => removeProductImageFile(index)}
                    />
                  ))}
                </div>
              )}
              {productImageFiles.length === 0 && (
                <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-chalk">
                  No images selected yet.
                </p>
              )}
            </div>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-black disabled:opacity-60"><Save size={17} />{saving ? "Saving..." : "Save product"}</button>
          </form>
        </Modal>
      )}

      {selectedProduct && (
        <Modal title={`Images: ${selectedProduct.name}`} onClose={() => setSelectedProduct(null)}>
          <div className="space-y-5">
            <div className="rounded-xl border border-dashed border-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">Upload product images</p>
                  <p className="mt-1 text-xs text-chalk">Choose files, then upload them to this product.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm font-bold text-text transition hover:border-accent hover:text-accent">
                  <ImagePlus size={16} />
                  Choose images
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={(event) => {
                      setImageFiles(Array.from(event.target.files ?? []));
                      event.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {imageFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {imageFiles.map((file, index) => (
                    <span key={`${file.name}-${file.lastModified}-${index}`} className="inline-flex items-center gap-2 rounded-lg bg-black/5 px-2.5 py-1 text-xs font-semibold text-chalk dark:bg-white/10">
                      {file.name}
                      <button type="button" onClick={() => setImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove selected image" className="text-red-500">
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <button type="button" disabled={imageBusy || imageFiles.length === 0} onClick={() => void uploadImages()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-black disabled:opacity-60"><ImagePlus size={16} /> Upload</button>
            </div>
            {imageBusy && <p className="text-sm text-chalk">Loading images...</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {(images ?? []).map((image) => (
                <div key={image.id + selectedImageIds} className="overflow-hidden rounded-xl border border-border bg-surface">
                  <img src={getImageUrl(image.url)} alt={image.altText ?? selectedProduct.name} className="h-44 w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${image.isPrimary ? "bg-green-500/15 text-green-700 dark:text-green-300" : "bg-black/5 text-chalk dark:bg-white/10"}`}>{image.isPrimary ? <CheckCircle2 size={13} /> : <Star size={13} />}{image.isPrimary ? "Primary" : "Image"}</span>
                    <div className="flex gap-2">
                      {!image.isPrimary && <IconButton label="Set primary" onClick={() => void makePrimary(image.id)} icon={<Star size={14} />} />}
                      <IconButton label="Delete image" onClick={() => void removeImage(image.id)} icon={<Trash2 size={14} />} danger />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!imageBusy && (images ?? []).length === 0 && <p className="rounded-xl bg-black/5 p-4 text-sm text-chalk dark:bg-white/5">No images uploaded yet.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}

function PendingImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {previewUrl && <img src={previewUrl} alt={file.name} className="h-28 w-full object-cover" />}
      <div className="flex items-center justify-between gap-2 p-2">
        <p className="truncate text-xs font-semibold text-chalk">{file.name}</p>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove selected image"
          className="shrink-0 rounded-lg border border-red-500/30 p-1.5 text-red-600 hover:bg-red-500/10"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 max-w-3xl rounded-2xl border border-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl font-bold text-text">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-chalk hover:bg-black/5"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function IconButton({ label, icon, onClick, danger = false }: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${danger ? "border-red-500/30 text-red-600 hover:bg-red-500/10" : "border-border text-chalk hover:border-accent hover:text-text"}`}
    >
      {icon}
    </button>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const styles = {
    ACTIVE: "bg-green-500/15 text-green-700 dark:text-green-300",
    DRAFT: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300",
    ARCHIVED: "bg-black/5 text-chalk dark:bg-white/10",
  };
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

function toPayload(form: ProductForm): ProductPayload {
  return {
    name: form.name.trim(),
    sku: form.sku,
    description: form.description,
    type: form.type,
    status: form.status,
    quantityOnHand: Number(form.quantityOnHand),
    salesPrice: Number(form.salesPrice),
    costPrice: form.costPrice ? Number(form.costPrice) : null,
    categoryId: form.categoryId || null,
  };
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
