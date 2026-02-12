import { z } from "zod";

export const extractedInvoiceSchema = z.object({
  supplierName: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  invoiceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  amountHT: z.number().nullable(),
  amountTVA: z.number().nullable(),
  amountTTC: z.number().nullable(),
  currency: z.string().nullable(),
});

export const makeCallbackSchema = z.object({
  invoiceId: z.uuid(),
  status: z.enum(["DONE", "ERROR"]),
  driveFileId: z.string().nullable().optional(),
  driveFileUrl: z.string().nullable().optional(),
  extracted: extractedInvoiceSchema.optional(),
  rawText: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});

export type MakeCallbackInput = z.infer<typeof makeCallbackSchema>;
