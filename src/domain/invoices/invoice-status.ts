export const InvoiceStatus = {
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  DONE: "DONE",
  ERROR: "ERROR",
  DUPLICATE: "DUPLICATE",
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
