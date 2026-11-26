import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTaxText } from "./TaxesText";

const TAX_URL = "/api/restaurant/tax";
const QUERY_KEY = "taxes";

// ===== استخراج البيانات من الـ response =====
// الشكل: {success, data: {message, data: [...], pagination?}} (ويتحمل أشكال تانية)
const extractList = (body) => {
  let d = body;
  for (let i = 0; i < 3 && d && !Array.isArray(d); i++) {
    const k = ["items", "taxes", "rows", "data"].find((key) => Array.isArray(d?.[key]));
    if (k) return d[k];
    d = d.data;
  }
  return Array.isArray(d) ? d : [];
};

const extractTotalPages = (body, limit) => {
  const layers = [body, body?.data, body?.data?.data];
  for (const layer of layers) {
    const m = layer?.meta ?? layer?.pagination;
    if (!m) continue;
    const pages = m.totalPages ?? m.pages ?? m.lastPage;
    if (pages) return pages;
    if (m.total) return Math.max(1, Math.ceil(m.total / limit));
  }
  return 1;
};

export default function Taxes() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { tx, isRTL } = useTaxText();

  const [pagination, setPagination] = useState({
    pageIndex: location.state?.pageIndex ?? 0,
    pageSize: Number(localStorage.getItem("tablePageSize")) || 15,
  });

  const page = pagination.pageIndex + 1; // الـ API بيبدأ من 1
  const limit = pagination.pageSize;

  const { data: body, isLoading } = useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: async () => {
      const { data } = await api.get(TAX_URL, { params: { page, limit } });
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => extractList(body), [body]);
  const totalPages = extractTotalPages(body, limit);

  // PATCH /tax/{id}/toggle-status
  const toggleStatus = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`${TAX_URL}/${id}/toggle-status`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(tx("statusUpdated"));
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Error",
      );
    },
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: tx("name"),
        cell: ({ row }) => {
          const { name, nameAr } = row.original;
          return (
            <span className="font-semibold">
              {isRTL ? nameAr || name : name || nameAr}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: tx("amount"),
        cell: ({ row }) => {
          const { amount, amountType } = row.original;
          return (
            <span className="font-mono">
              {amount}
              {amountType === "percentage" ? "%" : ""}
            </span>
          );
        },
      },
      {
        accessorKey: "taxType",
        header: tx("taxType"),
        cell: ({ row }) => {
          const type = row.original.taxType;
          return (
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                type === "include"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-amber-50 text-amber-600",
              )}
            >
              {tx(type)}
            </span>
          );
        },
      },
      {
        accessorKey: "modules",
        header: tx("modules"),
        cell: ({ row }) => (
          <span>
            {tx(row.original.modules)}
            {row.original.moduleType && row.original.moduleType !== "all"
              ? ` / ${tx(row.original.moduleType)}`
              : ""}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: tx("status"),
        cell: ({ row }) => {
          const isActive = row.original.status === "active";
          return (
            <div className="flex items-center justify-center gap-2">
              <Switch
                checked={isActive}
                disabled={toggleStatus.isPending}
                onCheckedChange={() => toggleStatus.mutate(row.original.id)}
              />
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  isActive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {isActive ? tx("active") : tx("inactive")}
              </span>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRTL, toggleStatus.isPending],
  );

  return (
    <GenericDataTable
      title={tx("taxes")}
      columns={columns}
      data={rows}
      isLoading={isLoading}
      queryKey={QUERY_KEY}
      deleteApiUrl={TAX_URL}
      // pagination من السيرفر
      pagination={pagination}
      setPagination={setPagination}
      pageCount={totalPages}
      hideSearch
      onAdd={() =>
        navigate("/taxes/add", { state: { fromPage: pagination.pageIndex } })
      }
      onEdit={(row) =>
        navigate(`/taxes/edit/${row.id}`, {
          state: { fromPage: pagination.pageIndex },
        })
      }
    />
  );
}