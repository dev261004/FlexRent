const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api$/, "");

/**
 * Returns a complete, valid image URL for display across customer and vendor interfaces.
 * Handles Cloudinary URLs, HTTP to HTTPS conversion, relative local uploads, and fallback images.
 */
export function getProductImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") {
    return FALLBACK_PRODUCT_IMAGE;
  }

  let formattedUrl = url.trim();
  if (!formattedUrl) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  // Convert http Cloudinary URLs to https to avoid mixed-content issues
  if (formattedUrl.startsWith("http://res.cloudinary.com")) {
    formattedUrl = formattedUrl.replace("http://res.cloudinary.com", "https://res.cloudinary.com");
  }

  // Absolute HTTP / HTTPS URLs (Cloudinary, Unsplash, external S3)
  if (formattedUrl.startsWith("http://") || formattedUrl.startsWith("https://")) {
    return formattedUrl;
  }

  // Local relative paths starting with / or uploads/
  if (!formattedUrl.startsWith("/")) {
    formattedUrl = `/${formattedUrl}`;
  }

  return `${BACKEND_URL}${formattedUrl}`;
}
