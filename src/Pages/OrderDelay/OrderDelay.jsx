import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericDataTable from "@/components/GenericDataTable";
import { useGet } from "@/hooks/useGet";
import { useTranslation } from "@/hooks/useTranslation";

// عدّلي المسار هنا لو الـ base URL مختلف عندك
const API_URL = "/api/restaurant/order-delay-alerts";
const QUERY_KEY = "orderDelayAlerts";

const ORDER_STATUS_LABELS = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  preparing: { ar: "قيد التحضير", en: "Preparing" },
  ready: { ar: "جاهز", en: "Ready" },
  delivered: { ar: "تم التوصيل", en: "Delivered" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

export default function OrderDelay() {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });

  // الـ API بيرجع الشكل: { success, data: { message, data: [...] } }
  const { data, isLoading } = useGet(QUERY_KEY, API_URL);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.data)
    ? data.data.data
    : [];

  const columns = [
    {
      accessorKey: "name",
      header: t("nameCol") || "اسم التنبيه",
    },
    {
      id: "emails",
      header: t("emailsCol") || "البريد الإلكتروني",
      cell: ({ row }) => {
        const emails = row.original.emails || [];
        return (
          <span className="text-xs" title={emails.join(", ")}>
            {emails.length
              ? emails.length === 1
                ? emails[0]
                : `${emails[0]} +${emails.length - 1}`
              : "-"}
          </span>
        );
      },
    },
    {
      id: "branches",
      header: t("branchesCol") || "الفروع",
      cell: ({ row }) =>
        row.original.allBranches ? (
          <span className="text-xs font-semibold text-primary">
            {t("allBranches") || "كل الفروع"}
          </span>
        ) : (
          <span className="text-xs">
            {(row.original.branchIds || []).length} {t("branchSelected") || "فرع"}
          </span>
        ),
    },
    {
      accessorKey: "maxDelayMinutes",
      header: t("maxDelayCol") || "الحد الأقصى للتأخير (دقيقة)",
    },
    {
      id: "orderStatus",
      header: t("orderStatusCol") || "حالات الطلب",
      cell: ({ row }) => {
        const statuses = row.original.orderStatus || [];
        const labels = statuses.map(
          (s) => ORDER_STATUS_LABELS[s]?.[isRTL ? "ar" : "en"] || s
        );
        return <span className="text-xs">{labels.join(", ") || "-"}</span>;
      },
    },
    {
      accessorKey: "isActive",
      header: t("statusCol") || "الحالة",
    },
  ];

  return (
    <GenericDataTable
      title={t("orderDelayAlertsTitle") || "تنبيهات تأخير الطلبات"}
      columns={columns}
      data={rows}
      isLoading={isLoading}
      onAdd={() => navigate("/delay-order/add")}
      onEdit={(row) => navigate(`/delay-order/edit/${row.id}`)}
      editApiUrl={API_URL}
      deleteApiUrl={API_URL}
      queryKey={QUERY_KEY}
      pagination={pagination}
      setPagination={setPagination}
    />
  );
}