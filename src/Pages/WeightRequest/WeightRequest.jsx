import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GenericDataTable from "@/components/GenericDataTable";
import { useGet } from "@/hooks/useGet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";


// ---- مشتركة مع WeightRequestAdd.jsx ----
export const BASE = "/api/restaurant/weight-requests";
export const KEY = "weight-requests";

export const STATUS = {
  awaiting_weighing: { cls: "bg-amber-50 text-amber-600" },
  awaiting_customer_approval: { cls: "bg-blue-50 text-blue-600" },
  approved: { cls: "bg-emerald-50 text-emerald-600" },
  cancelled: { cls: "bg-rose-50 text-rose-600" },
  expired: { cls: "bg-slate-100 text-slate-500" },
};

export const toArray = (res) => {
  let value = res;

  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.foods)) return value.foods;
    if (Array.isArray(value.data)) return value.data;

    value = value.items ?? value.foods ?? value.data;
  }

  return [];
};

export const toObject = (res) => {
  let value = res;

  for (let depth = 0; depth < 6; depth += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (!value.data || typeof value.data !== "object" || Array.isArray(value.data)) return value;

    value = value.data;
  }

  return value;
};

export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const s = STATUS[status];
  return (
    <span
      className={cn(
        "text-xs font-bold px-2.5 py-1 rounded-full",
        s?.cls ?? "bg-slate-100 text-slate-500"
      )}
    >
      {s ? t(`status.${status}`) : status}
    </span>
  );
};

export default function WeightRequest() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({
    pageIndex: location.state?.pageIndex ?? 0,
    pageSize: Number(localStorage.getItem("tablePageSize")) || 15,
  });

  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const params = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(status !== "all" && { status }),
  };

  const { data: res, isLoading } = useGet(KEY, BASE, params);
  const rows = toArray(res);
  const paginationData = res?.data?.data?.pagination ?? res?.pagination;
  const pageCount =
    paginationData?.totalPages ??
    res?.meta?.totalPages ??
    Math.max(1, Math.ceil((paginationData?.total ?? rows.length) / pagination.pageSize));

  const columns = useMemo(
    () => [

      {
        accessorKey: "userName",
        header: t("customer"),
        cell: ({ row }) => row.original.userName ?? row.original.customerName ?? row.original.customer?.name ?? "—",
      },
      {
        accessorKey: "total",
        header: t("total"),
        cell: ({ row }) => row.original.total ?? row.original.totalAmount ?? row.original.totals?.subtotal ?? "—",
      },
      {
        accessorKey: "status",
        header: t("status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-60 h-10 rounded-xl bg-white shadow-sm border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {Object.keys(STATUS).map((value) => (
              <SelectItem key={value} value={value}>
                {t(`status.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <GenericDataTable
        title={t("listTitle")}
        columns={columns}
        data={rows}
        isLoading={isLoading}
        queryKey={KEY}
        hideSearch
        pagination={pagination}
        setPagination={setPagination}
        pageCount={pageCount}
        onEdit={(row) =>
          navigate(`/weight-requests/edit/${row.id}`, {
            state: { fromPage: pagination.pageIndex },
          })
        }
      />
    </div>
  );
}