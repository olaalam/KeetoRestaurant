import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye, Copy, SlidersHorizontal, X, Search, FileSpreadsheet } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import useDateRangeStore from "../../store/Usedaterangestore";
import useAuthStore from "../../store/useAuthStore";
import { hasPermission } from "@/lib/permissions";
import OrdersSummaryCards from "./OrdersSummaryCards";
import { exportOrdersToExcel } from "./Exportorderstoexcel";

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [orderSource, setOrderSource] = useState("all");
  const [orderType, setOrderType]     = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cityId, setCityId]           = useState("all");
  const [branchId, setBranchId]       = useState("all");
  const [zoneId, setZoneId]           = useState("all");
  const [paymentMethod, setPaymentMethod]   = useState("all");
  const [discountType, setDiscountType]     = useState([]);
  const [isDiscountDropdownOpen, setIsDiscountDropdownOpen] = useState(false);
  const [couponId, setCouponId]             = useState("all");
  const [couponCode, setCouponCode]         = useState("");
  const [discountId, setDiscountId]         = useState("all");
  const [firstOrderDiscountId, setFirstOrderDiscountId] = useState("all");
  const [hasDiscount, setHasDiscount]       = useState("all");
  const [isPointsRedeemed, setIsPointsRedeemed] = useState("all");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime]     = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { startDate, endDate, setStartDate, setEndDate, clearDateRange } =
    useDateRangeStore();

  const schedules = useAuthStore((state) => state.schedules);
  const user = useAuthStore((state) => state.user);
  const canFilterOrders = hasPermission(user, "order", "filter");

  useEffect(() => {
    if (!startDate && schedules && schedules.length > 0) {
      const now = new Date();
      const formattedToday = now.toISOString().split("T")[0];
      setStartDate(formattedToday);
      setEndDate("");
    }
  }, [schedules, startDate, setStartDate, setEndDate]);

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

  const availableDiscountTypes = React.useMemo(() => {
    if (!selectOptions?.discountTypes) return [];
    return selectOptions.discountTypes.filter(
      (dt) =>
        !["points_redemption", "points"].includes(dt.value) &&
        !dt.name?.toLowerCase().includes("point") &&
        !dt.nameAr?.includes("نقاط")
    );
  }, [selectOptions]);

  const filteredBranches = React.useMemo(() => {
    if (!selectOptions?.branches) return [];
    if (cityId === "all") return selectOptions.branches;
    const cityZoneIds = (selectOptions.zones || [])
      .filter((z) => z.cityId === cityId)
      .map((z) => z.id);
    return selectOptions.branches.filter((b) => cityZoneIds.includes(b.zoneId));
  }, [selectOptions, cityId]);

  const filteredZones = React.useMemo(() => {
    if (!selectOptions?.zones) return [];
    if (cityId === "all") return selectOptions.zones;
    return selectOptions.zones.filter((z) => z.cityId === cityId);
  }, [selectOptions, cityId]);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: [
      "orders",
      startDate, endDate, startTime, endTime,
      orderSource, orderType, searchQuery, cityId, branchId, zoneId,
      paymentMethod, discountType, couponId, couponCode, discountId, firstOrderDiscountId,
      hasDiscount, isPointsRedeemed,
    ],
    queryFn: async () => {
      const params = {};
      // التاريخ والوقت بيتبعتوا سوا في نفس الـ param: 2026-09-27T15:44
      const withTime = (date, time) => (date && time ? `${date}T${time}` : date);
      if (startDate)   params.startDate   = withTime(startDate, startTime);
      if (endDate)     params.endDate     = withTime(endDate, endTime);
      if (orderSource      !== "all") params.orderSource      = orderSource;
      if (orderType        !== "all") params.orderType        = orderType;
      if (searchQuery.trim() !== "")  params.search           = searchQuery.trim();
      if (cityId           !== "all") params.cityId           = cityId;
      if (branchId         !== "all") params.branchId         = branchId;
      if (zoneId           !== "all") params.zoneId           = zoneId;
      if (paymentMethod    !== "all") params.paymentMethod    = paymentMethod;
      if (discountType.length > 0)    params.discountType     = discountType.join(",");
      if (couponId         !== "all") params.couponId         = couponId;
      if (couponCode)                params.couponCode       = couponCode;
      if (discountId       !== "all") params.discountId       = discountId;
      if (firstOrderDiscountId !== "all") params.firstOrderDiscountId = firstOrderDiscountId;
      if (hasDiscount      !== "all") params.hasDiscount      = hasDiscount;
      if (isPointsRedeemed !== "all") params.isPointsRedeemed = isPointsRedeemed;

      const res = await api.get(`/api/restaurant/order`, { params });
      const payload = res.data?.data ?? {};
      return { orders: payload.data ?? [], summary: payload.summary ?? null };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, cancelReasonId, customReason }) => {
      const formattedStatus = status.replace(/_/g, "-");
      const payload = { orderId, status: formattedStatus };
      if (cancelReasonId) payload.cancelReasonId = cancelReasonId;
      if (customReason)   payload.customReason   = customReason;
      const { data } = await api.put(`/api/restaurant/order/${orderId}`, payload);
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
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    if (newStatus === "cancelled") {
      setDialogConfig({ open: true, type: newStatus, orderId });
    } else {
      updateStatusMutation.mutate({ orderId, status: newStatus });
    }
  };

  const orders = ordersData?.orders ?? [];
  // لو الـ backend مبعتش summary نحسبها من الداتا
  const summary = ordersData?.summary ?? {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
  };

  const handleExportExcel = async () => {
    if (!orders.length) return;
    try {
      setIsExporting(true);
      await exportOrdersToExcel({
        orders,
        summary,
        t,
        rtl: language === "ar",
        fileName: `orders-${startDate || "all"}.xlsx`,
      });
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error(t("failedToExport") || "Failed to export Excel file");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearFilters = () => {
    clearDateRange();
    setStartTime("");
    setEndTime("");
    setOrderSource("all");
    setOrderType("all");
    setSearchQuery("");
    setCityId("all");
    setBranchId("all");
    setZoneId("all");
    setPaymentMethod("all");
    setDiscountType([]);
    setCouponId("all");
    setCouponCode("");
    setDiscountId("all");
    setFirstOrderDiscountId("all");
    setHasDiscount("all");
    setIsPointsRedeemed("all");
  };

  const getItemName = (item) => {
    if (!item) return "";
    const isAr = language === "ar";
    if (isAr) return item.nameAr || item.displayNameAr || item.name || item.displayName;
    return item.name || item.displayName || item.nameAr || item.displayNameAr;
  };

  const hasActiveFilters =
    orderSource !== "all" || orderType !== "all" || searchQuery.trim() !== "" ||
    cityId !== "all" || branchId !== "all" || zoneId !== "all" || 
    paymentMethod !== "all" || discountType.length > 0 ||
    couponId !== "all" || couponCode || discountId !== "all" ||
    firstOrderDiscountId !== "all" ||
    hasDiscount !== "all" || isPointsRedeemed !== "all" ||
    startDate || endDate || startTime || endTime;

  const columns = [
    {
      accessorKey: "dailyOrderNumber",
      header: t("orderNumber"),
      cell: ({ row }) => {
        const orderUrl = `/orders/details/${row.original.id}`;
        return (
          <a
            href={orderUrl}
            onClick={(e) => { e.preventDefault(); navigate(orderUrl); }}
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
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
            isDelivery
              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          }`}>
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
          <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate block" title={comment}>
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
      accessorKey: "paymentMethod",
      header: t("paymentMethod"),
      cell: ({ row }) => {
        const pm = row.original.paymentMethodName;
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
            {t(pm) || pm || "-"}
          </span>
        );
      },
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
    <div className="container mx-auto py-2">
      {/* شريط الفلاتر */}
      <div className="mb-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
            <SlidersHorizontal size={16} />
            <span>{t("filters") || "Filters"}</span>
            {hasActiveFilters && (
              <span className="bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">
                {t("active") || "Active"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                <X size={13} />
                {t("clearFilter") || "Clear All"}
              </button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting || isLoading || orders.length === 0}
              className="flex items-center gap-1.5 h-8 text-xs font-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-950"
            >
              <FileSpreadsheet size={14} />
              {isExporting ? (t("exporting") || "Exporting...") : (t("downloadExcel") || "Download Excel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-1.5 h-8 text-xs font-medium"
            >
              <SlidersHorizontal size={14} />
              {t("advancedFilter") || "Advanced Filter"}
            </Button>
          </div>
        </div>

        {/* Main Filters (Search, Start Date, End Date) */}
        <div className="flex flex-wrap items-end gap-4 p-4">
          {/* Search By Name / Phone / Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("search") || "Search (Name / Phone / Email)"}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder") || "Name, Phone, Email..."}
                className="w-[220px] h-9 text-sm pl-9"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("startDate") || "Start Date"}
            </label>
            <Input
              type="datetime-local"
              value={startDate ? `${startDate}T${startTime || "00:00"}` : ""}
              disabled={!canFilterOrders}
              onChange={(e) => {
                const [d, tm] = e.target.value.split("T");
                setStartDate(d || "");
                setStartTime(d ? tm || "" : "");
              }}
              className="w-[210px] h-9 text-sm cursor-pointer dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("endDate") || "End Date"}
            </label>
            <Input
              type="datetime-local"
              value={endDate ? `${endDate}T${endTime || "23:59"}` : ""}
              disabled={!canFilterOrders}
              onChange={(e) => {
                const [d, tm] = e.target.value.split("T");
                setEndDate(d || "");
                // أول اختيار من الـ calendar بيجي 00:00 فنخليه 23:59 عشان اليوم يتحسب كله
                setEndTime(!d ? "" : !endDate && tm === "00:00" ? "23:59" : tm || "");
              }}
              className="w-[210px] h-9 text-sm cursor-pointer dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>

        </div>

        {/* Advanced Filters (Collapsible) */}
        {showAdvancedFilters && (
          <div className="flex flex-wrap items-end gap-4 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Order Type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("orderType") || "Order Type"}
              </label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder={t("all") || "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all") || "All"}</SelectItem>
                  <SelectItem value="delivery">{t("delivery") || "Delivery"}</SelectItem>
                  <SelectItem value="takeaway">{t("takeaway") || "Takeaway"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("orderSource") || "Source"}
              </label>
              <Select value={orderSource} onValueChange={setOrderSource}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder={t("all") || "All"} />
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

            {/* City */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("city") || "City"}
              </label>
              <Select value={cityId} onValueChange={(v) => { setCityId(v); setBranchId("all"); setZoneId("all"); }}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder={t("all") || "All"} />
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

            {/* Zone */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("zone") || "Zone"}
              </label>
              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder={t("all") || "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all") || "All"}</SelectItem>
                  {filteredZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {getItemName(zone)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("branch") || "Branch"}
              </label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder={t("all") || "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all") || "All"}</SelectItem>
                  {filteredBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {getItemName(branch)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("paymentMethod") || "Payment"}
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder={t("all") || "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all") || "All"}</SelectItem>
                  {selectOptions?.paymentMethods
                    ?.filter((pm) => ["cash_on_delivery", "cash", "visa"].includes(pm.value))
                    ?.map((pm) => (
                      <SelectItem key={pm.id} value={pm.value}>
                        {getItemName(pm)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Discount Type */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("discountType") || "Discount Type"}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDiscountDropdownOpen(!isDiscountDropdownOpen)}
                  className="w-[180px] h-9 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-between shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="truncate">
                    {discountType.length === 0
                      ? (t("all") || "All")
                      : discountType.length === 1
                      ? getItemName(availableDiscountTypes.find((dt) => dt.value === discountType[0])) || discountType[0]
                      : `${discountType.length} ${t("selected") || "selected"}`}
                  </span>
                  <span className="text-xs text-slate-400">▼</span>
                </button>

                {isDiscountDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDiscountDropdownOpen(false)}
                    />
                    <div className="absolute z-50 top-full mt-1 left-0 w-[220px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl p-2 max-h-60 overflow-y-auto">
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer text-sm"
                        onClick={() => {
                          setDiscountType([]);
                          setCouponId("all");
                          setCouponCode("");
                          setDiscountId("all");
                          setFirstOrderDiscountId("all");
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={discountType.length === 0}
                          onChange={() => {}}
                          className="rounded border-slate-300"
                        />
                        <span>{t("all") || "All"}</span>
                      </div>
                      {availableDiscountTypes.map((dt) => {
                        const isSelected = discountType.includes(dt.value);
                        return (
                          <div
                            key={dt.id}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer text-sm"
                            onClick={() => {
                              let updated;
                              if (isSelected) {
                                updated = discountType.filter((v) => v !== dt.value);
                              } else {
                                updated = [...discountType, dt.value];
                              }
                              setDiscountType(updated);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-300"
                            />
                            <span className="truncate">{getItemName(dt)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Has Discount Switch */}
            <div className="flex flex-col gap-1.5 justify-center">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("hasDiscount") || "Has Discount"}
              </label>
              <div className="flex items-center h-9 gap-2">
                <Switch
                  checked={hasDiscount === "true"}
                  onCheckedChange={(checked) => setHasDiscount(checked ? "true" : "all")}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {hasDiscount === "true" ? (t("yes") || "Yes") : (t("all") || "All")}
                </span>
              </div>
            </div>

            {/* Is Points Redeemed Switch */}
            <div className="flex flex-col gap-1.5 justify-center">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("Points Redemption") || "Points Redeemed"}
              </label>
              <div className="flex items-center h-9 gap-2">
                <Switch
                  checked={isPointsRedeemed === "true"}
                  onCheckedChange={(checked) => setIsPointsRedeemed(checked ? "true" : "all")}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {isPointsRedeemed === "true" ? (t("yes") || "Yes") : (t("all") || "All")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <OrdersSummaryCards summary={summary} isLoading={isLoading} />

      <GenericDataTable
        title={t("ordersManagement")}
        columns={columns}
        data={orders}
        isLoading={isLoading}
        queryKey={`orders-${status} `}
        onEdit={false}
        actions={false}
        hideSearch={true}
      />

      <ReasonDialog
        isOpen={dialogConfig.open}
        onClose={() => setDialogConfig({ open: false, type: null, orderId: null })}
        onConfirm={(data) =>
          updateStatusMutation.mutate({
            orderId: dialogConfig.orderId,
            status: dialogConfig.type,
            ...data,
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