"use client";

import { useQuery } from "@tanstack/react-query";
import type { Invoice } from "./types";

/**
 * Fetch invoices list from API.
 */
export const useInvoices = () => {
  return useQuery<{ data: Invoice[] }>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await fetch("/api/invoices");
      if (!res.ok) {
        throw new Error("Failed to fetch invoices");
      }
      return res.json();
    },
  });
};
