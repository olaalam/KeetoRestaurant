import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericDataTable from "@/components/GenericDataTable";
import { useGet } from "@/hooks/useGet";
import { useTranslation } from "@/hooks/useTranslation";

const API_URL = "/api/restaurant/order-delay-alerts";
const QUERY_KEY = "orderDelayAlerts";

export default function OrderDelay() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });

  const { data, isLoading } = useGet(QUERY_KEY, API_URL);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.data)
    ? data.data.data
    : [];

  const getStatusLabel = (status) => {
    if (!status) return "-";
    const key = `status${status.charAt(0).toUpperCase() + status.slice(1)}`;
    return t(key) || status;
  };

  const columns = [
    {
      accessorKey: "name",
      header: t("alertNameCol"),
    },
    {
      id: "emails",
      header: t("emailsCol"),
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
      header: t("branchesCol"),
      cell: ({ row }) =>
        row.original.allBranches ? (
          <span className="text-xs font-semibold text-primary">
            {t("allBranches")}
          </span>
        ) : (
          <span className="text-xs">
            {(row.original.branchIds || []).length} {t("branchSelected")}
          </span>
        ),
    },
    {
      accessorKey: "maxDelayMinutes",
      header: t("maxDelayCol"),
    },
    {
      id: "orderStatus",
      header: t("orderStatusCol"),
      cell: ({ row }) => {
        const statuses = row.original.orderStatus || [];
        const labels = statuses.map((s) => getStatusLabel(s));
        return <span className="text-xs">{labels.join(", ") || "-"}</span>;
      },
    },
    {
      accessorKey: "isActive",
      header: t("statusCol"),
    },
  ];

  return (
    <GenericDataTable
      title={t("orderDelayAlertsTitle")}
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