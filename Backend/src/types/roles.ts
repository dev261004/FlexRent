export const ROLES = ["CUSTOMER", "ADMIN", "VENDOR"] as const;
export type AppRole = (typeof ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "DISABLED"] as const;
export type AppUserStatus = (typeof USER_STATUSES)[number];
