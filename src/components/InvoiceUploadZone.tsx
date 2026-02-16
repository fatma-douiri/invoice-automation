"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadInvoice } from "@/hooks/useUploadInvoice";

export const InvoiceUploadZone = () => {
  const { mutate: upload, isPending } = useUploadInvoice();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.type === "application/pdf") {
        upload(file);
      }
    },
    [upload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400"
      }`}
    >
      <input {...getInputProps()} />
      {isPending ? (
        <p className="text-gray-600">Uploading...</p>
      ) : isDragActive ? (
        <p className="text-blue-600 font-medium">Drop the PDF here</p>
      ) : (
        <div>
          <p className="text-gray-700 font-medium">Drag and drop a PDF here</p>
          <p className="text-sm text-gray-500">or click to select</p>
        </div>
      )}
    </div>
  );
};
