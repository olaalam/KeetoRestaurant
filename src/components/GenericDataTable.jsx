import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DeleteDialog from "./DeleteDialog";
import LoadingSpinner from "./LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

export default function GenericDataTable({
  columns,
  data = [],
  title,
  onAdd,
  onEdit,
  deleteApiUrl,
  queryKey,
  isLoading,
  actions = true,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();

  // Pre-process and sort data to append newly added items at the very end
  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime; // newest first → newly added at top
    });
  }, [data]);

  // إضافة عمود الترقيم التلقائي وعمود العمليات
  const tableColumns = useMemo(() => {
    const baseColumns = [
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          const indexInCurrentPage = table
            .getRowModel()
            .rows.findIndex((r) => r.id === row.id);

          return (
            <span className="font-mono text-xs font-semibold text-slate-400">
              {pageIndex * pageSize + indexInCurrentPage + 1}
            </span>
          );
        },
        size: 60,
      },
      ...columns,
    ];

    if (actions) {
      baseColumns.push({
        id: "actions",
        header: t("actionsCol"),
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(row.original)}
                className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {deleteApiUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(row.original.id)}
                className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      });
    }

    return baseColumns;
  }, [columns, onEdit, deleteApiUrl, actions]);

  const table = useReactTable({
    data: sortedData,
    columns: tableColumns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  return (
    <div className="space-y-6 w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-4">
          {/* Icon Box */}
          <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm border border-primary/10 shrink-0">
            <span className="text-xl font-black uppercase">{title?.[0]}</span>
          </div>

          {/* Title Text */}
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight dark:text-slate-100">
              {title}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {t("manageAndMonitor")}{" "}
              <span className="font-semibold text-primary">{title}</span>
            </p>
          </div>
        </div>

        {/* Controls Container */}
        <div className="flex items-center gap-3 self-end sm:self-center w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className={cn(
              "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400",
              isRTL ? "right-3" : "left-3"
            )} />
            <Input
              placeholder={t("searchPlaceholder")}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className={cn(
                "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary transition-all text-sm",
                isRTL ? "pr-9 pl-4" : "pl-9 pr-4"
              )}
            />
          </div>

          {onAdd && (
            <Button onClick={onAdd} className="h-10 rounded-xl font-medium shadow-sm hover:opacity-95 bg-primary text-primary-foreground gap-2 shrink-0 transition-all">
              <Plus className="h-4 w-4" />
              <span>{t("addNew")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* TABLE BOX */}
      <div className="rounded-2xl border border-slate-100 bg-white dark:bg-slate-950 shadow-sm overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-14 align-middle text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-4 px-6 text-center"
                    >
                      {/* تم إضافة text-center هنا لتبديل محاذاة العناوين للمنتصف */}
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="text-center h-48"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <LoadingSpinner className="h-6 w-6 text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50/40 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className="py-4 px-6 align-middle text-sm text-slate-600 dark:text-slate-300 font-medium text-center"
                      >
                        {/* تم إضافة text-center وتعديل محاذاة الفليكس داخل الخلايا لتصبح بالمنتصف تماماً */}
                        <div className="flex items-center justify-center w-full">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="text-center h-48 text-sm text-slate-400 font-medium"
                  >
                    {t("noDataFound")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 order-2 sm:order-1">
          {t("pageOf")} <span className="text-slate-700 dark:text-slate-300">{table.getState().pagination.pageIndex + 1}</span> {t("of")}{" "}
          <span className="text-slate-700 dark:text-slate-300">{table.getPageCount()}</span>
        </p>

        <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-9 rounded-xl border-slate-200 hover:bg-slate-50 font-medium text-xs gap-1.5 transition-colors"
          >
            {isRTL ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            <span>{t("prev")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-9 rounded-xl border-slate-200 hover:bg-slate-50 font-medium text-xs gap-1.5 transition-colors"
          >
            <span>{t("next")}</span>
            {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* DELETE DIALOG */}
      <DeleteDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        apiUrl={deleteApiUrl}
        onSuccessKey={queryKey}
        id={deleteId}
      />
    </div>
  );
}