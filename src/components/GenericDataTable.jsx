import React, { useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";

export default function GenericDataTable({
  columns,
  data = [],
  title,
  onAdd,
  onEdit,
  editApiUrl,
  deleteApiUrl,
  queryKey,
  isLoading,
  actions = true,
  highlightedId,
  pagination: controlledPagination,
  setPagination: setControlledPagination,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const { t, isRTL } = useTranslation();
  const queryClient = useQueryClient();
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const pagination = controlledPagination ?? internalPagination;
  const setPagination = setControlledPagination ?? setInternalPagination;

  // 1. Mutation لتحديث الـ Status أو الـ isActive فوراً عند تغيير السويتش
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus, keyName }) => {
      // تركيب الرابط المخصص للخصومات أو الرابط العادي لبقية الشاشات
      const url = editApiUrl.includes("discounts")
        ? `${editApiUrl}/${id}/toggle-status`
        : `${editApiUrl}/${id}`;

      // بناء الـ Body ديناميكياً بناءً على اسم الحقل الممرر (status أو isActive)
      const requestBody = {};
      requestBody[keyName] = newStatus;

      return await api.put(url, requestBody);
    },
    onSuccess: () => {
      if (queryKey) {
        queryClient.invalidateQueries([queryKey]);
      }
      toast.success(t("updateStatusSuccessfully"));
    },
    onError: (error) => {
      console.error("Failed to update status:", error);
      toast.error(t("updateStatusError"));
    }
  });

  // ترتيب البيانات بناءً على تاريخ الإنشاء
  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [data]);

// بناء الأعمدة وفحص حقول الـ Switch
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
  ];

  columns.forEach((col) => {
    // إذا كان العمود يملك cell خاص مسبقاً (مثل الموجود في Users.jsx)، نستخدمه مباشرة
    if (col.cell) {
      baseColumns.push(col);
      return;
    }

    const isStatusField = col.accessorKey === "status" || col.accessorKey === "isActive";

    if (isStatusField && editApiUrl) {
      baseColumns.push({
        ...col,
        cell: ({ row }) => {
          const currentStatus = row.getValue(col.accessorKey);
          const isActive = currentStatus === "active" || currentStatus === "paid" || currentStatus === true || currentStatus === 1;
          const isBlocked = currentStatus === "blocked";
          const rowId = row.original.id || row.original.menuItemId;

          return (
            <div className="flex items-center justify-center gap-2">
              <Switch
                checked={isActive}
                disabled={updateStatusMutation.isPending}
                onCheckedChange={(checked) => {
                  let newStatus;
                  if (col.accessorKey === "isActive") {
                    newStatus = checked;
                  } else if (typeof currentStatus === "string") {
                    if (currentStatus === "paid" || currentStatus === "unpaid") {
                      newStatus = checked ? "paid" : "unpaid";
                    } else if (currentStatus === "active" || currentStatus === "blocked") {
                      newStatus = checked ? "active" : "blocked";
                    } else {
                      newStatus = checked ? "active" : "inactive";
                    }
                  } else {
                    newStatus = checked;
                  }

                  updateStatusMutation.mutate({ id: rowId, newStatus, keyName: col.accessorKey });
                }}
              />
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                isActive 
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" 
                  : isBlocked 
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" 
                    : "bg-slate-100 text-slate-500"
              )}>
                {isActive ? t("active") : isBlocked ? (t("blocked") || "blocked") : t("inactive")}
              </span>
            </div>
          );
        }
      });
    } else {
      baseColumns.push(col);
    }
  });

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
              onClick={() => setDeleteId(row.original.id || row.original.menuItemId)}
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
}, [columns, onEdit, deleteApiUrl, actions, editApiUrl, updateStatusMutation.isPending, t]);
  const table = useReactTable({
    data: sortedData,
    columns: tableColumns,
    state: { globalFilter, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
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
          <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm border border-primary/10 shrink-0">
            <span className="text-xl font-black uppercase">{title?.[0]}</span>
          </div>

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
                table.getRowModel().rows.map((row) => {
                  const isHighlighted = String(row.original.id) === String(highlightedId);

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "group border-b border-slate-50 dark:border-slate-900 transition-all duration-500",
                        isHighlighted
                          ? "bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/70 border-l-4 border-l-amber-500 font-semibold"
                          : "hover:bg-slate-50/40 dark:hover:bg-slate-900/30"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="py-4 px-6 align-middle text-sm text-slate-600 dark:text-slate-300 font-medium text-center"
                        >
                          <div className="flex items-center justify-center w-full">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
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
        <div className="flex items-center m-auto gap-1.5 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-9 w-9 p-0 rounded-lg border-slate-200"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {Array.from({ length: table.getPageCount() }, (_, i) => (
            <Button
              key={i}
              variant={table.getState().pagination.pageIndex === i ? "default" : "outline"}
              size="sm"
              onClick={() => table.setPageIndex(i)}
              className={cn(
                "h-9 w-9 p-0 rounded-lg border-slate-200 font-semibold text-xs transition-all",
                table.getState().pagination.pageIndex === i
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-slate-50"
              )}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-9 w-9 p-0 rounded-lg border-slate-200"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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