"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Upload invoice PDF and refetch list.
 */
export const useUploadInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/invoices", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Upload failed");
      }

      return res.json();
    },
    onSuccess: () => {
      // Refetch invoices after successful upload
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};
