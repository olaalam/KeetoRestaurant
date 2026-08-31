import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye, Copy, Calendar } from "lucide-react";
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
import useAuthStore from "../../store/useAuthStore";

export default function Order() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();

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

  // جلب جداول المواعيد من الـ Auth Store
  const schedules = useAuthStore((state) => state.schedules);

  // ضبط التاريخ بناءً على وقت إغلاق المطعم
  useEffect(() => {
    if (!startDate && !endDate && schedules && schedules.length > 0) {
      const todayIndex = new Date().getDay();
      const todaySchedule = schedules.find((s) => s.dayOfWeek === todayIndex);

      if (todaySchedule && !todaySchedule.isOffDay) {
        const closingTime = todaySchedule.closingTime;
        const [closingHour] = closingTime.split(":").map(Number);

        const now = new Date();
        const formattedToday = now.toISOString().split("T")[0];

        if (closingHour < 6) {
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          const formattedTomorrow = tomorrow.toISOString().split("T")[0];

          setStartDate(formattedToday);
          setEndDate(formattedTomorrow);
        } else {
          setStartDate(formattedToday);
          setEndDate(formattedToday);
        }
      }
    }
  }, [schedules, startDate, endDate, setStartDate, setEndDate]);

  const orderStatuses = [
    "pending",
    "accepted",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refund",
  ];

  // جلب خيارات الفلاتر
  const { data: selectOptions } = useQuery({
    queryKey: ["order-select-data"],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/order/select-data");
      return res.data?.data?.data || {};
    },
  });

  // جلب الطلبات
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
    onSuccess: () => {
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
      cell: ({ row }) => {
        const orderUrl = `/orders/details/${row.original.id}`;
        return (
          <a
            href={orderUrl}
            onClick={(e) => {
              e.preventDefault();
              navigate(orderUrl);
            }}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer inline-block"
          >
            {row.getValue("dailyOrderNumber")}
          </a>
        );
      },
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
            <div className="flex items-center gap-1 font-medium text-gray-800 dark:text-gray-200">
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
                  className="text-gray-400 hover:text-primary transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
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
        <span className="px-2 py-1 rounded-full text-xs capitalize">
          {t(row.original.orderType)}
        </span>
      ),
    },
    {
      accessorKey: "rating",
      header: t("rating"),
      cell: ({ row }) => {
        const isDelivery = row.original.rating === "delivery";
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
              isDelivery
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            }`}
          >
            {t(row.original.rating)}
          </span>
        );
      },
    },
    {
      accessorKey: "ratingComment",
      header: t("ratingComment"),
      cell: ({ row }) => {
        const comment = row.original.ratingComment;
        return (
          <span
            className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate block"
            title={comment}
          >
            {comment || "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: t("totalAmount"),
      cell: ({ row }) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {row.original.totalAmount} {t("currency")}
        </span>
      ),
    },
    {
      accessorKey: "orderSource",
      header: t("orderSource"),
      cell: ({ row }) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {row.original.orderSource}
        </span>
      ),
    },
    {
      id: "branchZone",
      accessorFn: (row) => `${row.branchName} - ${row.zoneName}`,
      header: t("branchNamezoneName"),
      cell: ({ getValue }) => (
        <span className="font-semibold text-green-600 dark:text-green-400">{getValue()}</span>
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
            {orderStatuses.map((status) => {
              const isTakeawayReady =
                row.original.orderType === "takeaway" && status === "out_for_delivery";
              const displayLabel = isTakeawayReady ? "ready" : status;

              return (
                <SelectItem key={status} value={status} className="capitalize">
                  {t(displayLabel)}
                </SelectItem>
              );
            })}
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
            <span className="text-xs text-gray-500 dark:text-gray-400">
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
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        
        {/* Start Date */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t("startDate") || "Start Date"}:
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40 h-10 cursor-pointer dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:dark:invert"
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
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40 h-10 cursor-pointer dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:dark:invert"
          />
        </div>

        {/* Order Source Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
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
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
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
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
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