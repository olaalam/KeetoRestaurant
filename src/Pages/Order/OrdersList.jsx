import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import useDateRangeStore from "@/store/useDateRangeStore";

export default function OrdersList({ status }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { startDate, endDate, setStartDate, setEndDate, clearDateRange } =
    useDateRangeStore();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", status, startDate, endDate],
    queryFn: async () => {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get(`/api/restaurant/order/${status}`, { params });
      return res.data.data.data;
    },
  });

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    try {
      const response = await api.get(
        `/api/restaurant/order/${orderId}/invoice`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice-${orderNumber || orderId}.pdf`);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error fetching invoice PDF:", error);
      alert(t("failedToDownloadInvoice"));
    }
  };

  const columns = [
    {
      accessorKey: "dailyOrderNumber",
      header: t("orderNumber"),
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => navigate(`/orders/details/${row.original.id}`)}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
        >
          {row.getValue("dailyOrderNumber")}
        </button>
      ),
    },
    {
      accessorKey: "customerName",
      header: t("customerInfo"),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 font-medium text-gray-800">
            <User size={14} className="text-gray-500" />
            {row.original.customerName}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Phone size={12} />
            {row.original.customerPhone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "orderType",
      header: t("orderType"),
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs capitalize ${
            row.original.orderType === "delivery"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {t(row.original.orderType)}
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: t("totalAmount"),
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {row.getValue("totalAmount")} {t("currency")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs capitalize ${
            row.original.status === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {t(row.original.status)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("dateTime"),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex flex-col text-sm">
            <span>{date.toLocaleDateString()}</span>
            <span className="text-xs text-gray-500">
              {date.toLocaleTimeString()}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const orderId = row.original.id;
        const orderNumber = row.original.orderNumber;

        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-primary/10 text-primary"
              onClick={() => navigate(`/orders/details/${orderId}`)}
              title={t("viewDetails")}
            >
              <Eye size={18} />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-emerald-50 text-emerald-600"
              onClick={() => handleDownloadInvoice(orderId, orderNumber)}
              title={t("printInvoice")}
            >
              <Printer size={18} />
            </Button>
          </div>
        );
      },
    },
  ];

  const tableTitle = `${t(status)} ${t("orders")}`;

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <label className="text-sm font-bold text-slate-700">
          {t("startDate") || "Start Date"}:
        </label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-48 h-10"
        />
        <label className="text-sm font-bold text-slate-700">
          {t("endDate") || "End Date"}:
        </label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-48 h-10"
        />
        <Button variant="outline" onClick={clearDateRange} className="h-10">
          {t("clearFilter") || "Clear Filter"}
        </Button>
      </div>

      <GenericDataTable
        title={tableTitle}
        columns={columns}
        data={orders}
        isLoading={isLoading}
        queryKey={`orders-${status}`}
        onEdit={false}
        actions={false}
      />
    </div>
  );
}
