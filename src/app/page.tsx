"use client";

import dynamic from "next/dynamic";
import { InvoiceUploadZone } from "@/components/InvoiceUploadZone";

const InvoicesTable = dynamic(
  () =>
    import("@/components/InvoicesTable").then((m) => ({
      default: m.InvoicesTable,
    })),
  { ssr: false },
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice Automation
            </h1>
            <p className="text-gray-600 mt-2">
              Upload and manage your invoices
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-white p-8 rounded-lg border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Invoice
            </h2>
            <InvoiceUploadZone />
          </div>

          {/* Invoices Table Section */}
          <div className="bg-white p-8 rounded-lg border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invoices
            </h2>
            <InvoicesTable />
          </div>
        </div>
      </div>
    </div>
  );
}
