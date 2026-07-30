/**
 * Utility to resolve notification actionUrl to the appropriate path based on user role and basePath.
 * Prevents Vendors from being redirected to Customer dashboard routes (/dashboard/orders/...) when clicking notifications.
 */
export function getNotificationTargetUrl(
  actionUrl: string | null | undefined,
  userRole?: string | null,
  basePath?: string
): string | null {
  if (!actionUrl) return null;

  const role = (userRole || "").toUpperCase();
  const isVendor = role === "VENDOR" || basePath?.startsWith("/vendor");
  const isAdmin = role === "ADMIN" || basePath?.startsWith("/admin");

  if (isVendor) {
    // If URL is customer order detail page /dashboard/orders/[id] or legacy /dashboard/rentals/[id]
    const orderMatch = actionUrl.match(/\/dashboard\/(?:orders|rentals)\/([^/]+)/);
    if (orderMatch) {
      return `/vendor/operations/${orderMatch[1]}`;
    }
    // Replace any /dashboard prefix with /vendor
    if (actionUrl.startsWith("/dashboard")) {
      return actionUrl.replace(/^\/dashboard/, "/vendor");
    }
    return actionUrl;
  }

  if (isAdmin) {
    const orderMatch = actionUrl.match(/\/dashboard\/(?:orders|rentals)\/([^/]+)/);
    if (orderMatch) {
      return `/admin/orders/${orderMatch[1]}`;
    }
    if (actionUrl.startsWith("/dashboard")) {
      return actionUrl.replace(/^\/dashboard/, "/admin");
    }
    return actionUrl;
  }

  // For CUSTOMER or default role
  // Fix legacy /dashboard/rentals/[id] to /dashboard/orders/[id]
  if (actionUrl.startsWith("/dashboard/rentals/")) {
    return actionUrl.replace("/dashboard/rentals/", "/dashboard/orders/");
  }

  return actionUrl;
}
