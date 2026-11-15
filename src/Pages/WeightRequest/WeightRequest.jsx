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

// الألوان بس هنا، والنصوص في weightRequestsI18n.js (status.<key>)
export const STATUS = {
  awaiting_weighing: { cls: "bg-amber-50 text-amber-600" },
  awaiting_customer_approval: { cls: "bg-blue-50 text-blue-600" },
  approved: { cls: "bg-emerald-50 text-emerald-600" },
  cancelled: { cls: "bg-rose-50 text-rose-600" },
  expired: { cls: "bg-slate-100 text-slate-500" },
};

// عدّل الـ normalizers دي حسب شكل الـ response الفعلي
export const toArray = (res) =>
  Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? res?.items ?? [];
export const toObject = (res) => res?.data ?? res ?? null;

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
    // الرجوع من صفحة التعديل بيبعت pageIndex (AddPage.handleCancel)
    pageIndex: location.state?.pageIndex ?? 0,
    pageSize: Number(localStorage.getItem("tablePageSize")) || 15,
  });

  // GenericDataTable بيعيد ضبط الصفحة من location.state مع كل تغيير في الداتا،
  // وده بيبوّظ الـ pagination من السيرفر. فبنقرأ القيمة مرة وننضّف الـ state.
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
  const pageCount =
    res?.pagination?.totalPages ??
    res?.meta?.totalPages ??
    Math.max(1, Math.ceil((res?.total ?? rows.length) / pagination.pageSize));

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: t("orderNo"),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{String(row.original.id).slice(0, 8)}</span>
        ),
      },
      {
        accessorKey: "customerName",
        header: t("customer"),
        cell: ({ row }) => row.original.customerName ?? row.original.customer?.name ?? "—",
      },
      {
        accessorKey: "total",
        header: t("total"),
        cell: ({ row }) => row.original.total ?? row.original.totalAmount ?? "—",
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