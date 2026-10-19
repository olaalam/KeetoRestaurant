import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye, Printer, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import useDateRangeStore from "../../store/Usedaterangestore";
import useAuthStore from "@/store/useAuthStore";
import { hasPermission } from "@/lib/permissions";

export default function OrdersList({ status }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const canFilterOrders = hasPermission(user, "order", "filter");

  const { startDate, endDate, setStartDate, setEndDate, clearDateRange } =
    useDateRangeStore();

  // حالات الفلاتر الجديدة
  const [hasDiscount, setHasDiscount] = useState("all");
  const [isPointsRedeemed, setIsPointsRedeemed] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", status, startDate, endDate, hasDiscount, isPointsRedeemed],
    queryFn: async () => {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (hasDiscount && hasDiscount !== "all") params.hasDiscount = hasDiscount;
      if (isPointsRedeemed && isPointsRedeemed !== "all")
        params.isPointsRedeemed = isPointsRedeemed;

      const res = await api.get(`/api/restaurant/order/${status}`, { params });
      return res.data.data.data;
    },
  });

  const handleClearFilters = () => {
    clearDateRange();
    setHasDiscount("all");
    setIsPointsRedeemed("all");
  };

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
      cell: ({ row }) => {
        const handleCopyPhone = (e) => {
          e.stopPropagation();
          if (row.original.customerPhone) {
            navigator.clipboard.writeText(row.original.customerPhone);
            toast.success(t("copiedSuccessfully") || "تم نسخ رقم الهاتف بنجاح");
          }
        };

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 font-medium text-gray-800">
              <User size={14} className="text-gray-500" />
              {row.original.customerName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Phone size={12} />
                {row.original.customerPhone}
              </div>
              {row.original.customerPhone && (
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="text-gray-400 hover:text-primary transition-colors p-1 rounded hover:bg-slate-100"
                  title={t("copyPhone") || "نسخ الرقم"}
                >
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>
        );
      },
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
    <div className="container mx-auto py-2">
      {/* شريط الفلاتر المحدث */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        
        {/* Start Date */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t("startDate") || "Start Date"}:
          </label>
          <Input
            type="date"
            value={startDate}
            disabled={!canFilterOrders}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40 h-10"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t("endDate") || "End Date"}:
          </label>
          <Input
            type="date"
            value={endDate}
            disabled={!canFilterOrders}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40 h-10"
          />
        </div>

        {/* Has Discount Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t("hasDiscount") || "Has Discount"}:
          </label>
          <Select value={hasDiscount} onValueChange={setHasDiscount}>
            <SelectTrigger className="w-[130px] h-10">
              <SelectValue placeholder={t("all") || "All"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all") || "All"}</SelectItem>
              <SelectItem value="true">{t("yes") || "Yes"}</SelectItem>
              <SelectItem value="false">{t("no") || "No"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Is Points Redeemed Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t("isPointsRedeemed") || "Points Redeemed"}:
          </label>
          <Select value={isPointsRedeemed} onValueChange={setIsPointsRedeemed}>
            <SelectTrigger className="w-[130px] h-10">
              <SelectValue placeholder={t("all") || "All"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all") || "All"}</SelectItem>
              <SelectItem value="true">{t("yes") || "Yes"}</SelectItem>
              <SelectItem value="false">{t("no") || "No"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filter Button */}
        <Button
          variant="outline"
          onClick={handleClearFilters}
          disabled={!canFilterOrders}
          className="h-10"
        >
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