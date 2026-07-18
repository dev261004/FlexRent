import type { AdminRentalPeriod } from "../types";

export const MOCK_RENTAL_PERIODS: AdminRentalPeriod[] = [
  {
    id: "rp1",
    name: "Daily",
    minDays: 1,
    maxDays: 1,
    multiplier: 1,
  },
  {
    id: "rp2",
    name: "Weekend",
    minDays: 2,
    maxDays: 3,
    multiplier: 0.9,
  },
  {
    id: "rp3",
    name: "Weekly",
    minDays: 7,
    maxDays: 13,
    multiplier: 0.8,
  },
  {
    id: "rp4",
    name: "Monthly",
    minDays: 28,
    maxDays: 45,
    multiplier: 0.65,
  },
];
