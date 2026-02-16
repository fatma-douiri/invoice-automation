"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useInvoices } from "@/hooks/useInvoices";
import type { Invoice } from "@/hooks/types";

const columnHelper = createColumnHelper<Invoice>();

const statusColors: Record<string, string> = {
  UPLOADED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  DONE: "bg-green-100 text-green-800",
  ERROR: "bg-red-100 text-red-800",
  DUPLICATE: "bg-orange-100 text-orange-800",
};

const columns = [
  columnHelper.accessor("fileName", {
    header: "File",
    cell: (info) => (
      <span className="text-sm text-gray-900 font-medium">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${statusColors[info.getValue()]}`}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("supplierName", {
    header: "Supplier",
    cell: (info) => (
      <span className="text-sm text-gray-900">{info.getValue() || "-"}</span>
    ),
  }),
  columnHelper.accessor("invoiceNumber", {
    header: "Invoice #",
    cell: (info) => (
      <span className="text-sm text-gray-900">{info.getValue() || "-"}</span>
    ),
  }),
  columnHelper.accessor("amountTTC", {
    header: "Amount",
    cell: (info) => {
      const amount = info.getValue();
      const currency = info.row.original.currency || "EUR";
      return (
        <span className="text-sm text-gray-900">
          {amount ? `${amount} ${currency}` : "-"}
        </span>
      );
    },
  }),
  columnHelper.accessor("errorMessage", {
    header: "Error",
    cell: (info) => {
      const error = info.getValue();
      return error ? (
        <span className="text-xs text-red-600 truncate max-w-xs" title={error}>
          {error}
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  }),
];

export const InvoicesTable = () => {
  const { data, isLoading, error } = useInvoices();

  const table = useReactTable({
    columns,
    data: data?.data || [],
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 py-8">Loading invoices...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        Error loading invoices
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left font-medium text-gray-700"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-gray-500"
              >
                No invoices yet
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
