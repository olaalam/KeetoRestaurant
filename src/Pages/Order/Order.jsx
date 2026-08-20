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
  const { t, language } = useTranslation(); // افتراض وجود language أو i18n.language

  const [dialogConfig, setDialogConfig] = useState({
    open: false,
    type: null,
    orderId: null,
  });

  // حالات الفلاتر
  const [orderSource, setOrderSource] = useState("all");
  const [cityId, setCityId] = useState("all");
  const [branchId, setBranchId] = useState("all");

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

  // جلب خيارات الفلاتر بالمسار الصحيح للريسبونس
  const { data: selectOptions } = useQuery({
    queryKey: ["order-select-data"],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/order/select-data");
      return res.data?.data?.data || {};
    },
  });

  // جلب الطلبات بالمعلمات المحددة
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", startDate, endDate, orderSource, cityId, branchId],
    queryFn: async () => {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (orderSource && orderSource !== "all") params.orderSource = orderSource;
      if (cityId && cityId !== "all") params.cityId = cityId;
      if (branchId && branchId !== "all") params.branchId = branchId;

      const res = await api.get(`/api/restaurant/order`, { params });
      return res.data.data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, cancelReasonId }) => {
      const formattedStatus = status.replace(/_/g, "-");
      const payload = { orderId, status: formattedStatus };
      if (cancelReasonId) payload.cancelReasonId = cancelReasonId;

      const { data } = await api.put(
        `/api/restaurant/order/${orderId}`,
        payload
      );
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["orders"]);
      toast.success(t("orderStatusUpdatedSuccessfully"));
      setDialogConfig({ open: false, type: null, orderId: null });


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

  const handleClearFilters = () => {
    clearDateRange();
    setOrderSource("all");
    setCityId("all");
    setBranchId("all");
  };

  // دالة مساعدة لاختيار الاسم بناءً على اللغة المفعلة
  const getItemName = (item) => {
    if (!item) return "";
    const isAr = language === "ar";
    if (isAr) {
      return item.nameAr || item.displayNameAr || item.name || item.displayName;
    }
    return item.name || item.displayName || item.nameAr || item.displayNameAr;
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
      accessorKey: "orderSource",
      header: t("orderSource"),
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {row.original.orderSource}
        </span>
      ),
    },
    {
      id: "branchZone",
      accessorFn: (row) => `${row.branchName} - ${row.zoneName}`,
      header: t("branchName - zoneName"),
      cell: ({ getValue }) => (
        <span className="font-semibold text-green-600">{getValue()}</span>
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
      {/* شريط الفلاتر */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {/* Start Date */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">
            {t("startDate") || "Start Date"}:
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40 h-10"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">
            {t("endDate") || "End Date"}:
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40 h-10"
          />
        </div>

        {/* Order Source Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">
            {t("orderSource") || "Source"}:
          </label>
          <Select value={orderSource} onValueChange={setOrderSource}>
            <SelectTrigger className="w-[170px] h-10">
              <SelectValue placeholder={t("allSources") || "All Sources"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all") || "All"}</SelectItem>
              {selectOptions?.sources?.map((src) => (
                <SelectItem key={src.id} value={src.value}>
                  {getItemName(src)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">
            {t("city") || "City"}:
          </label>
          <Select value={cityId} onValueChange={setCityId}>
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue placeholder={t("allCities") || "All Cities"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all") || "All"}</SelectItem>
              {selectOptions?.cities?.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {getItemName(city)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">
            {t("branch") || "Branch"}:
          </label>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue placeholder={t("allBranches") || "All Branches"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all") || "All"}</SelectItem>
              {selectOptions?.branches?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {getItemName(branch)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filter Button */}
        <Button variant="outline" onClick={handleClearFilters} className="h-10">
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