import type { QuotationTemplate } from "../types";

export const MOCK_QUOTATION_TEMPLATES: QuotationTemplate[] = [
  {
    id: "qt1",
    name: "Standard Quotation",
    header:
      "FlexRent — Equipment Rental Quotation\nThank you for choosing FlexRent. Below is your rental estimate.",
    footer:
      "Terms: Deposit refundable on undamaged return.\nLate returns incur fees per org policy.\nContact: support@flexrent.app",
  },
  {
    id: "qt2",
    name: "Event Package",
    header:
      "FlexRent Event Rentals\nCustom package quotation for your event.",
    footer:
      "Prices valid for 7 days. Pickup & return windows apply.\nQuestions? events@flexrent.app",
  },
];
