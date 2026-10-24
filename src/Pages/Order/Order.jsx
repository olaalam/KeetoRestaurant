import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye, Copy, SlidersHorizontal, X } from "lucide-react";
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
import { hasPermission } from "@/lib/permissions";

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
  const [cityId, setCityId]           = useState("all");
  const [branchId, setBranchId]       = useState("all");
  const [zoneId, setZoneId]           = useState("all");
  const [paymentMethod, setPaymentMethod]   = useState("all");
  const [discountType, setDiscountType]     = useState("all");
  const [couponId, setCouponId]             = useState("all");
  const [couponCode, setCouponCode]         = useState("");
  const [discountId, setDiscountId]         = useState("all");
  const [firstOrderDiscountId, setFirstOrderDiscountId] = useState("all");
  const [hasDiscount, setHasDiscount]       = useState("all");
  const [isPointsRedeemed, setIsPointsRedeemed] = useState("all");
  const [singleDate, setSingleDate]         = useState("");

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

  // الفروع المفلترة حسب المدينة المختارة
  const filteredBranches = React.useMemo(() => {
    if (!selectOptions?.branches) return [];
    if (cityId === "all") return selectOptions.branches;
    // نجيب الـ zones الخاصة بالمدينة المختارة
    const cityZoneIds = (selectOptions.zones || [])
      .filter((z) => z.cityId === cityId)
      .map((z) => z.id);
    return selectOptions.branches.filter((b) => cityZoneIds.includes(b.zoneId));
  }, [selectOptions, cityId]);

  // الزون المفلترة حسب المدينة المختارة
  const filteredZones = React.useMemo(() => {
    if (!selectOptions?.zones) return [];
    if (cityId === "all") return selectOptions.zones;
    return selectOptions.zones.filter((z) => z.cityId === cityId);
  }, [selectOptions, cityId]);

  // جلب الطلبات مع كل الفلاتر
  const { data: orders = [], isLoading } = useQuery({
    queryKey: [
      "orders",
      startDate, endDate, singleDate,
      orderSource, cityId, branchId, zoneId,
      paymentMethod, discountType, couponId, couponCode, discountId, firstOrderDiscountId,
      hasDiscount, isPointsRedeemed,
    ],
    queryFn: async () => {
      const params = {};
      if (startDate)   params.startDate   = startDate;
      if (endDate)     params.endDate     = endDate;
      if (singleDate)  params.date        = singleDate;
      if (orderSource      !== "all") params.orderSource      = orderSource;
      if (cityId           !== "all") params.cityId           = cityId;
      if (branchId         !== "all") params.branchId         = branchId;
      if (zoneId           !== "all") params.zoneId           = zoneId;
      if (paymentMethod    !== "all") params.paymentMethod    = paymentMethod;
      if (discountType     !== "all") params.discountType     = discountType;
      if (couponId         !== "all") params.couponId         = couponId;
      if (couponCode)                params.couponCode       = couponCode;
      if (discountId       !== "all") params.discountId       = discountId;
      if (firstOrderDiscountId !== "all") params.firstOrderDiscountId = firstOrderDiscountId;
      if (hasDiscount      !== "all") params.hasDiscount      = hasDiscount;
      if (isPointsRedeemed !== "all") params.isPointsRedeemed = isPointsRedeemed;

      const res = await api.get(`/api/restaurant/order`, { params });
      return res.data.data.data;
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

  const handleClearFilters = () => {
    clearDateRange();
    setSingleDate("");
    setOrderSource("all");
    setCityId("all");
    setBranchId("all");
    setZoneId("all");
    setPaymentMethod("all");
    setDiscountType("all");
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
    orderSource !== "all" || cityId !== "all" || branchId !== "all" ||
    zoneId !== "all" || paymentMethod !== "all" || discountType !== "all" ||
    couponId !== "all" || couponCode || discountId !== "all" ||
    firstOrderDiscountId !== "all" ||
    hasDiscount !== "all" || isPointsRedeemed !== "all" ||
    startDate || endDate || singleDate;

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
      <div className="mb-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
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
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
            >
              <X size={13} />
              {t("clearFilter") || "Clear All"}
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-end gap-4 p-4">

          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("startDate") || "Start Date"}
            </label>
            <Input
              type="date"
              value={startDate}
              disabled={!canFilterOrders}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-38 h-9 text-sm cursor-pointer dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("endDate") || "End Date"}
            </label>
            <Input
              type="date"
              value={endDate}
              disabled={!canFilterOrders}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-38 h-9 text-sm cursor-pointer dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>

          {/* Single Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("date") || "Date"}
            </label>
            <Input
              type="date"
              value={singleDate}
              disabled={!canFilterOrders}
              onChange={(e) => setSingleDate(e.target.value)}
              className="w-38 h-9 text-sm cursor-pointer dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
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
                {selectOptions?.paymentMethods?.map((pm) => (
                  <SelectItem key={pm.id} value={pm.value}>
                    {getItemName(pm)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Discount Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("discountType") || "Discount Type"}
            </label>
            <Select value={discountType} onValueChange={(v) => { setDiscountType(v); setCouponId("all"); setCouponCode(""); setDiscountId("all"); setFirstOrderDiscountId("all"); }}>
              <SelectTrigger className="w-[170px] h-9 text-sm">
                <SelectValue placeholder={t("all") || "All"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all") || "All"}</SelectItem>
                {selectOptions?.discountTypes?.map((dt) => (
                  <SelectItem key={dt.id} value={dt.value}>
                    {getItemName(dt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coupon — يظهر بس لو اختار coupon كـ discount type */}
          {discountType === "coupon" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {t("coupon") || "Coupon"}
                </label>
                <Select value={couponId} onValueChange={setCouponId}>
                  <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue placeholder={t("all") || "All"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all") || "All"}</SelectItem>
                    {selectOptions?.coupons?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {getItemName(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {t("couponCode") || "Coupon Code"}
                </label>
                <Input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. SUMMER2026"
                  className="w-36 h-9 text-sm"
                />
              </div>
            </>
          )}

          {/* Discount Id — يظهر لو اختار discount_id */}
          {discountType === "discount_id" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("discount") || "Discount"}
              </label>
              <Select value={discountId} onValueChange={setDiscountId}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder={t("all") || "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all") || "All"}</SelectItem>
                  {selectOptions?.discounts?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {getItemName(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* First Order Discount — يظهر بس لو اختار first_order_discount */}
          {discountType === "first_order_discount" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("firstOrderDiscount") || "1st Order Discount"}
              </label>
              <Select value={firstOrderDiscountId} onValueChange={setFirstOrderDiscountId}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder={t("all") || "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all") || "All"}</SelectItem>
                  {selectOptions?.firstOrderDiscounts?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {getItemName(f)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Has Discount */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("hasDiscount") || "Has Discount"}
            </label>
            <Select value={hasDiscount} onValueChange={setHasDiscount}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder={t("all") || "All"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all") || "All"}</SelectItem>
                <SelectItem value="true">{t("yes") || "Yes"}</SelectItem>
                <SelectItem value="false">{t("no") || "No"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Is Points Redeemed */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("isPointsRedeemed") || "Points Redeemed"}
            </label>
            <Select value={isPointsRedeemed} onValueChange={setIsPointsRedeemed}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder={t("all") || "All"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all") || "All"}</SelectItem>
                <SelectItem value="true">{t("yes") || "Yes"}</SelectItem>
                <SelectItem value="false">{t("no") || "No"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
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