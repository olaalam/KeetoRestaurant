import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import ReasonDialog from "./ReasonDialog";
import { Input } from "@/components/ui/input";
import useDateRangeStore from "../../store/Usedaterangestore";

export default function Order() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [dialogConfig, setDialogConfig] = useState({
    open: false,
    type: null,
    orderId: null,
  });
  const { startDate, endDate, setStartDate, setEndDate, clearDateRange } =
    useDateRangeStore();

  const orderStatuses = [
    "pending",
    "accepted",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refund",
  ];

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", startDate, endDate],
    queryFn: async () => {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get(`/api/restaurant/order`, { params });
      return res.data.data.data;
    },
  });

  // تعديل الـ URL هنا ليصبح ديناميكيًا حسب الحالة
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, cancelReasonId }) => {
      // تحويل out_for_delivery إلى out-for-delivery
      const formattedStatus = status.replace(/_/g, "-");

      // إرسال formattedStatus في الـ payload حتى يقرأه الباك إند بشكل صحيح
      const payload = { orderId, status: formattedStatus };
      if (cancelReasonId) payload.cancelReasonId = cancelReasonId;

      // استخدام الـ URL الجديد (مثال: /api/restaurant/order/out-for-delivery) بدون الـ ID في النهاية
      const { data } = await api.put(
        `/api/restaurant/order/${formattedStatus}`,
        payload,
      );
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["orders"]);
      toast.success(t("orderStatusUpdatedSuccessfully"));
      setDialogConfig({ open: false, type: null, orderId: null });

      const targetRoute = variables.status.replace(/_/g, "-");
      if (targetRoute) {
        navigate(`/orders/${targetRoute}`);
      }
    },
    onError: (error) => {
      const serverErrorMessage =
        error?.response?.data?.error?.message || t("failedToUpdateStatus");
      toast.error(serverErrorMessage);
      console.error("Update Error:", error);
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    if (newStatus === "cancelled") {
      setDialogConfig({ open: true, type: newStatus, orderId });
    } else {
      updateStatusMutation.mutate({ orderId, status: newStatus });
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
          {row.original.totalAmount} {t("currency")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        <Select
          defaultValue={row.original.status}
          onValueChange={(value) => handleStatusChange(row.original.id, value)}
          disabled={
            updateStatusMutation.isPending &&
            updateStatusMutation.variables?.orderId === row.original.id
          }
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder={t("selectStatus")} />
          </SelectTrigger>
          <SelectContent>
            {orderStatuses.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {t(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Button
            size="sm"
            variant="ghost"
            className="hover:bg-primary/10 text-primary"
            onClick={() => navigate(`/orders/details/${row.original.id}`)}
          >
            <Eye size={18} />
          </Button>
        </div>
      ),
    },
  ];

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
        title={t("ordersManagement")}
        columns={columns}
        data={orders}
        isLoading={isLoading}
        queryKey="orders"
        actions={false}
      />

      <ReasonDialog
        isOpen={dialogConfig.open}
        onClose={() =>
          setDialogConfig({ open: false, type: null, orderId: null })
        }
        onConfirm={(cancelReasonId) =>
          updateStatusMutation.mutate({
            orderId: dialogConfig.orderId,
            status: dialogConfig.type,
            cancelReasonId,
          })
        }
        title={
          dialogConfig.type === "cancelled"
            ? t("cancelOrder")
            : t("rejectOrder")
        }
      />
    </div>
  );
}
