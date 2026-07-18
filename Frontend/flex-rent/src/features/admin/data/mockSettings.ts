import type { OrgRentalSettings } from "../types";

export const SETTINGS_STORAGE_KEY = "flexrent-admin-org-settings";

export const DEFAULT_ORG_SETTINGS: OrgRentalSettings = {
  orgName: "FlexRent HQ",
  lateFeePercent: 5,
  flatLateFee: 200,
  defaultDeposit: 2000,
  pickupWindowHours: 4,
  returnGraceHours: 2,
};
