import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye, Printer, Copy, SlidersHorizontal, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const canFilterOrders = hasPermission(user, "order", "filter");

  const { startDate, endDate, setStartDate, setEndDate, clearDateRange } =
    useDateRangeStore();

  // حالات الفلاتر الجديدة والقديمة
  const [orderSource, setOrderSource]   = useState("all");
  const [orderType, setOrderType]       = useState("all"); // فلتر نوع الطلب الجديد
  const [searchQuery, setSearchQuery]   = useState("");    // فلتر البحث الجديد (اسم، هاتف، إيميل)
  const [cityId, setCityId]             = useState("all");
  const [branchId, setBranchId]         = useState("all");
  const [zoneId, setZoneId]             = useState("all");
  const [paymentMethod, setPaymentMethod]     = useState("all");
  const [discountType, setDiscountType]       = useState([]); // Multi-select array
  const [isDiscountDropdownOpen, setIsDiscountDropdownOpen] = useState(false);
  const [couponId, setCouponId]               = useState("all");
  const [couponCode, setCouponCode]           = useState("");
  const [discountId, setDiscountId]           = useState("all");
  const [firstOrderDiscountId, setFirstOrderDiscountId] = useState("all");
  const [hasDiscount, setHasDiscount]         = useState("all");
  const [isPointsRedeemed, setIsPointsRedeemed] = useState("all");
  const [singleDate, setSingleDate]           = useState("");

  // جلب خيارات الفلاتر
  const { data: selectOptions } = useQuery({
    queryKey: ["order-select-data"],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/order/select-data");
      return res.data?.data?.data || {};
    },
  });

  // استبعاد Points Redemption من أنواع الخصومات
  const availableDiscountTypes = React.useMemo(() => {
    if (!selectOptions?.discountTypes) return [];
    return selectOptions.discountTypes.filter(
      (dt) =>
        !["points_redemption", "points"].includes(dt.value) &&
        !dt.name?.toLowerCase().includes("point") &&
        !dt.nameAr?.includes("نقاط")
    );
  }, [selectOptions]);

  // الفروع المفلترة حسب المدينة
  const filteredBranches = React.useMemo(() => {
    if (!selectOptions?.branches) return [];
    if (cityId === "all") return selectOptions.branches;
    const cityZoneIds = (selectOptions.zones || [])
      .filter((z) => z.cityId === cityId)
      .map((z) => z.id);
    return selectOptions.branches.filter((b) => cityZoneIds.includes(b.zoneId));
  }, [selectOptions, cityId]);

  // الزون المفلترة حسب المدينة
  const filteredZones = React.useMemo(() => {
    if (!selectOptions?.zones) return [];
    if (cityId === "all") return selectOptions.zones;
    return selectOptions.zones.filter((z) => z.cityId === cityId);
  }, [selectOptions, cityId]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: [
      "orders", status,
      startDate, endDate, singleDate,
      orderSource, orderType, searchQuery, cityId, branchId, zoneId,
      paymentMethod, discountType, couponId, couponCode, discountId, firstOrderDiscountId,
      hasDiscount, isPointsRedeemed,
    ],
    queryFn: async () => {
      const params = {};
      if (startDate)   params.startDate   = startDate;
      if (endDate)     params.endDate     = endDate;
      if (singleDate)  params.date        = singleDate;
      if (orderSource      !== "all") params.orderSource      = orderSource;
      if (orderType        !== "all") params.orderType        = orderType;
      if (searchQuery.trim() !== "")  params.search           = searchQuery.trim(); // بارامتر البحث بالاسم، الهاتف، والإيميل
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

      const res = await api.get(`/api/restaurant/order/${status}`, { params });
      return res.data.data.data;
    },
  });

  const handleClearFilters = () => {
    clearDateRange();
    setSingleDate("");
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
    startDate || endDate || singleDate;

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    try {
      const response = await api.get(
        `/api/restaurant/order/${orderId}/invoice`,
        { responseType: "blob" },
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
        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
          row.original.orderType === "delivery"
            ? "bg-purple-100 text-purple-700"
            : "bg-blue-100 text-blue-700"
        }`}>
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
        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
          row.original.status === "pending"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"
        }`}>
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
            <span className="text-xs text-gray-500">{date.toLocaleTimeString()}</span>
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

          {/* Order Type Filter (delivery / takeaway) */}
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
              className="w-38 h-9 text-sm cursor-pointer"
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
              className="w-38 h-9 text-sm cursor-pointer"
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
              className="w-38 h-9 text-sm cursor-pointer"
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
      </div>

      <GenericDataTable
        title={tableTitle}
        columns={columns}
        data={orders}
        isLoading={isLoading}
        queryKey={`orders-${status}`}
        onEdit={false}
        actions={false}
        hideSearch={true}
      />
    </div>
  );
}