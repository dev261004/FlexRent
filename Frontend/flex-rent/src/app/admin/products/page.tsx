import { ProductManager } from "@/components/products/ProductManager";

export default function AdminProductsPage() {
  return (
    <ProductManager
      title="Products"
      description="Create, update, archive, and manage images for the live rental catalog."
    />
  );
}
