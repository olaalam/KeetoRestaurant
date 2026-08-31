import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  CheckCheck,
  XCircle,
  Undo2,
  MapPin,
  CreditCard,
  Store,
  Receipt,
  HomeIcon,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Hash,
  Info,
  ShoppingBag,
  Loader2,
  Copy,
  Printer,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import ReasonDialog from "./ReasonDialog";

const statusConfig = {
  pending: {
    labelKey: "pending",
    color: "border-amber-500 bg-amber-50 text-amber-700",
    icon: Clock,
  },
  accepted: {
    labelKey: "accepted",
    color: "border-blue-500 bg-blue-50 text-blue-700",
    icon: CheckCircle,
  },
  preparing: {
    labelKey: "preparing",
    color: "border-purple-500 bg-purple-50 text-purple-700",
    icon: Package,
  },
  out_for_delivery: {
    labelKey: "outForDelivery",
    color: "border-indigo-500 bg-indigo-50 text-indigo-700",
    icon: Truck,
  },
  delivered: {
    labelKey: "delivered",
    color: "border-green-500 bg-green-50 text-green-700",
    icon: CheckCheck,
  },
  cancelled: {
    labelKey: "cancelled",
    color: "border-red-500 bg-red-50 text-red-700",
    icon: XCircle,
  },
  refund: {
    labelKey: "refund",
    color: "border-gray-500 bg-gray-50 text-gray-700",
    icon: Undo2,
  },
};

function PreparationCountdown({ durationInMinutes, startTime }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!durationInMinutes || !startTime) return;

    const startTimestamp = new Date(startTime).getTime();
    const targetTimestamp = startTimestamp + durationInMinutes * 60 * 1000;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetTimestamp - now;
      setTimeLeft(difference > 0 ? difference : 0);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [durationInMinutes, startTime]);

  if (!durationInMinutes) {
    return <span className="text-gray-400 font-medium">لم يتم التحديد</span>;
  }

  if (timeLeft <= 0) {
    return (
      <span className="text-red-600 font-bold tracking-wider font-mono">
        00:00:00
      </span>
    );
  }

  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  const format = (num) => String(num).padStart(2, "0");

  return (
    <span className="text-primary font-mono font-bold text-base tracking-wider dir-ltr">
      {format(hours)}:{format(minutes)}:{format(seconds)}
    </span>
  );
}

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [dialogConfig, setDialogConfig] = useState({ open: false, type: null });
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState("");

  const [deliverySearchQuery, setDeliverySearchQuery] = useState("");
  const [isDeliveryDropdownOpen, setIsDeliveryDropdownOpen] = useState(false);

  const [isDurationDialogOpen, setIsDurationDialogOpen] = useState(false);
  const [preparationDuration, setPreparationDuration] = useState("");

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const orderStatuses = [
    "pending",
    "accepted",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refund",
  ];

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await api.get(`/api/restaurant/order/${orderId}`);
      return res.data?.data?.data || res.data?.data;
    },
    enabled: !!orderId,
  });

  const { data: deliveryMen = [], isLoading: isDeliveryLoading } = useQuery({
    queryKey: ["deliveryMenSelect"],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/order/select");
      return res.data?.data?.data || res.data?.data || [];
    },
    enabled: isAssignDialogOpen || order?.status === "preparing",
  });

  const { data: ordersList = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get(`/api/restaurant/order`);
      return res.data?.data?.data || res.data?.data || [];
    },
  });

  const currentOrderIndex = ordersList.findIndex((o) => o.id === orderId);
  const previousOrder =
    currentOrderIndex !== -1 && currentOrderIndex < ordersList.length - 1
      ? ordersList[currentOrderIndex + 1]
      : null;
  const nextOrder =
    currentOrderIndex > 0 ? ordersList[currentOrderIndex - 1] : null;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, cancelReasonId, customReason }) => {
      const payload = { status };
      if (cancelReasonId) payload.cancelReasonId = cancelReasonId;
      if (customReason) payload.customReason = customReason;

      const res = await api.put(`/api/restaurant/order/${orderId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["order", orderId]);
      queryClient.invalidateQueries(["orders"]);
      toast.success(t("statusUpdatedSuccess") || "تم تحديث حالة الطلب بنجاح");
      setDialogConfig({ open: false, type: null });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        t("statusUpdateError") ||
        "فشل في تحديث الحالة",
      );
    },
  });

  const updateDurationMutation = useMutation({
    mutationFn: async (duration) => {
      const res = await api.put(`/api/restaurant/order/${orderId}/duration`, {
        duration: duration,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      setIsDurationDialogOpen(false);
      setPreparationDuration("");
      toast.success(
        t("durationUpdatedSuccess") || "تم تحديد وقت التحضير بنجاح",
      );
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        t("durationUpdateError") ||
        "فشل في تحديد وقت التحضير",
      );
    },
  });

const assignDeliveryMutation = useMutation({
  mutationFn: async (deliveryManId) => {
    // 1. تحديث المندوب دائماً
    const res = await api.put(
      `/api/restaurant/order/${orderId}/assign-delivery`,
      {
        deliveryManId,
      },
    );

    // 2. لو مفيش مندوب قديم (أول مرة يتعين) وكان الطلب في حالة preparing، نغير الحالة لـ out_for_delivery
    const hasDeliveryMan = order?.deliveryMan?.id || order?.deliveryManId;
    if (!hasDeliveryMan && order?.status === "preparing") {
      await api.put(`/api/restaurant/order/${orderId}`, {
        status: "out_for_delivery",
      });
    }

    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries(["order", orderId]);
    queryClient.invalidateQueries(["orders"]);
    toast.success(
      t("deliveryManAssignedSuccess") ||
      "تم حفظ بيانات المندوب بنجاح",
    );
    setIsAssignDialogOpen(false);
    setSelectedDeliveryMan("");
  },
  onError: (error) => {
    toast.error(
      error?.response?.data?.message ||
      t("assignDeliveryError") ||
      "فشل في تعيين مندوب التوصيل",
    );
  },
});
  const handleStatusChange = (newStatus) => {
    if (newStatus === "cancelled" || newStatus === "refund") {
      setDialogConfig({ open: true, type: newStatus });
    } else {
      updateStatusMutation.mutate({ status: newStatus });
    }
  };

  const handleAssignDelivery = () => {
    if (!selectedDeliveryMan) {
      toast.error(
        t("selectDeliveryManFirst") || "يرجى اختيار مندوب توصيل أولاً",
      );
      return;
    }
    assignDeliveryMutation.mutate(selectedDeliveryMan);
  };

  const handleOpenInvoice = async () => {
    if (!orderId) return;
    try {
      setIsInvoiceLoading(true);
      setIsInvoiceOpen(true);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
      }
      const response = await api.get(
        `/api/restaurant/order/${orderId}/invoice`,
        {
          responseType: "blob",
        },
      );
      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] || "application/pdf",
      });
      const nextPdfUrl = URL.createObjectURL(blob);
      setPdfUrl(nextPdfUrl);
    } catch (error) {
      console.error("Failed to fetch order invoice PDF:", error);
      toast.error(t("failedToDownloadInvoice") || "فشل في تحميل الفاتورة");
      setIsInvoiceOpen(false);
    } finally {
      setIsInvoiceLoading(false);
    }
  };

  const closeInvoiceDialog = () => {
    setIsInvoiceOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
    }
  };

  const filteredDeliveryMen = deliveryMen.filter((man) => {
    const label = `${man.name || man.fullName || man.label || ""} ${man.phone || ""}`;
    return label.toLowerCase().includes(deliverySearchQuery.toLowerCase());
  });

  if (isLoading)
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (error || !order)
    return (
      <div className="text-center p-8 text-red-500">
        {t("orderNotFound") || "الطلب غير موجود"}
      </div>
    );

  const StatusIcon = statusConfig[order.status]?.icon || Info;
  const currentStatusStyle = statusConfig[order.status] || {
    color: "border-gray-200 bg-gray-100 text-gray-800",
    labelKey: order.status,
  };

  const displayCurrentLabel = order.orderType === "takeaway" && order.status === "out_for_delivery"
    ? "ready"
    : currentStatusStyle.labelKey;

  const deliveryPerson = order.deliveryMan || order.driver;

  return (
    <div className="w-full mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex 2xl:hidden flex-col gap-3 bg-white p-3 sm:p-5 rounded-2xl border shadow-sm mb-6">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Button
              size="icon"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-none shadow-sm shrink-0"
              onClick={() => navigate("/orders")}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" />
            </Button>

            <div className="flex items-center gap-1 bg-gray-100/80 px-2 sm:px-3 py-1.5 rounded-xl border border-gray-200/80 shrink-0">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Order #</span>
              <span className="text-sm sm:text-base font-black text-gray-900">{order.dailyOrderNumber}</span>
            </div>

            <Badge className={`${currentStatusStyle.color} h-9 sm:h-11 font-bold rounded-xl border px-2.5 sm:px-3 text-xs sm:text-sm flex items-center gap-1.5 shadow-sm`}>
              <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate max-w-[90px] sm:max-w-none">{t(currentStatusStyle.labelKey)}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 sm:h-11 px-2.5 sm:px-3.5 font-semibold text-xs sm:text-sm gap-1"
              disabled={!previousOrder}
              onClick={() => previousOrder && navigate(`/orders/details/${previousOrder.id}`)}
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180" />
              <span className="hidden sm:inline">{t("previous") || "السابق"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 sm:h-11 px-2.5 sm:px-3.5 font-semibold text-xs sm:text-sm gap-1"
              disabled={!nextOrder}
              onClick={() => nextOrder && navigate(`/orders/details/${nextOrder.id}`)}
            >
              <span className="hidden sm:inline">{t("next") || "التالي"}</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180" />
            </Button>
          </div>

          <div className="shrink-0">
            <Button
              onClick={handleOpenInvoice}
              className="rounded-xl h-9 sm:h-11 px-3 sm:px-4 font-semibold text-xs sm:text-sm bg-primary text-white shadow-sm hover:bg-primary/90 gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{t("viewInvoice") || "الفاتورة"}</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-100 w-full">
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
            {order.orderType && (
              <Badge
                variant="outline"
                className="bg-amber-50/70 border-amber-200 text-amber-800 h-8 sm:h-10 font-semibold rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="capitalize">
                  {document.documentElement.dir === "rtl"
                    ? order.orderType === "delivery"
                      ? "توصيل"
                      : order.orderType === "takeaway"
                        ? "استلام"
                        : order.orderType
                    : order.orderType}
                </span>
              </Badge>
            )}

            {(order.paymentMethodName || order.paymentMethodNameAr) && (
              <Badge
                variant="outline"
                className="bg-emerald-50/70 border-emerald-200 text-emerald-800 h-8 sm:h-10 font-semibold rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="capitalize">
                  {document.documentElement.dir === "rtl" && order.paymentMethodNameAr
                    ? order.paymentMethodNameAr
                    : order.paymentMethodName?.replace(/_/g, " ")}
                </span>
              </Badge>
            )}
          </div>

          <div className="shrink-0">
            {order.orderSource && (
              <Badge
                variant="outline"
                className="bg-blue-50/70 border-blue-200 text-blue-800 h-8 sm:h-10 font-semibold rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
              >
                <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="capitalize">
                  {document.documentElement.dir === "rtl"
                    ? order.orderSource === "online_order"
                      ? "طلب أونلاين"
                      : order.orderSource?.replace(/_/g, " ")
                    : order.orderSource?.replace(/_/g, " ")}
                </span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="hidden 2xl:flex w-full items-center justify-between gap-4 bg-white p-5 rounded-2xl border shadow-sm mb-6">
        <div className="flex flex-1 items-center gap-3 flex-wrap w-full">
          <Button
            size="icon"
            className="w-12 h-12 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-none shadow-sm shrink-0 transition-all"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 min-w-[3rem] bg-gray-100/80 px-3 py-1.5 rounded-xl border border-gray-200/80 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Order #
            </span>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              {order.dailyOrderNumber}
            </span>
          </div>

          <Separator
            orientation="vertical"
            className="h-8 bg-gray-200"
          />

          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge
              className={`${currentStatusStyle.color} h-11 font-bold rounded-xl border px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none`}
            >
              <StatusIcon className="w-4 h-4" />
              {t(currentStatusStyle.labelKey)}
            </Badge>

            {order.orderType && (
              <Badge
                variant="outline"
                className="bg-amber-50/70 border-amber-200 text-amber-800 h-11 font-semibold rounded-xl px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none"
              >
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span className="capitalize">
                  {document.documentElement.dir === "rtl"
                    ? order.orderType === "delivery"
                      ? "توصيل"
                      : order.orderType === "takeaway"
                        ? "استلام"
                        : order.orderType
                    : order.orderType}
                </span>
              </Badge>
            )}

            {(order.paymentMethodName || order.paymentMethodNameAr) && (
              <Badge
                variant="outline"
                className="bg-emerald-50/70 border-emerald-200 text-emerald-800 h-11 font-semibold rounded-xl px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="capitalize">
                  {document.documentElement.dir === "rtl" &&
                    order.paymentMethodNameAr
                    ? order.paymentMethodNameAr
                    : order.paymentMethodName?.replace(/_/g, " ")}
                </span>
              </Badge>
            )}

            {order.orderSource && (
              <Badge
                variant="outline"
                className="bg-blue-50/70 border-blue-200 text-blue-800 h-11 font-semibold rounded-xl px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none"
              >
                <Store className="w-4 h-4 text-blue-600" />
                <span className="capitalize">
                  {document.documentElement.dir === "rtl"
                    ? order.orderSource === "online_order"
                      ? "طلب أونلاين"
                      : order.orderSource?.replace(/_/g, " ")
                    : order.orderSource?.replace(/_/g, " ")}
                </span>
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 h-11 px-4 font-semibold text-sm"
              disabled={!previousOrder}
              onClick={() =>
                previousOrder && navigate(`/orders/details/${previousOrder.id}`)
              }
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              {t("previous") || "السابق"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 h-11 px-4 font-semibold text-sm"
              disabled={!nextOrder}
              onClick={() =>
                nextOrder && navigate(`/orders/details/${nextOrder.id}`)
              }
            >
              {t("next") || "التالي"}
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </div>

          <Button
            onClick={handleOpenInvoice}
            className="rounded-xl gap-2 h-11 px-5 font-semibold text-sm bg-primary text-white shadow-sm hover:bg-primary/90"
          >
            <Receipt className="w-4 h-4" />
            {t("viewInvoice") || "عرض الفاتورة"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-6 xl:col-span-2">
          <Card className="rounded-2xl border shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {t("order Details") || "تفاصيل الطلب"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-center gap-2.5 text-sm">
                  <Store className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-medium">
                    {t("branch") || "الفرع"}:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {order.branch?.name || t("Delivery")}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm">
                  <Store className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-medium">
                    {t("zone") || "المنطقة"}:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {order.zone?.name || t("notAvailable")}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-medium">
                    {t("orderDate") || "تاريخ الطلب"}:
                  </span>
                  <span className="font-semibold text-gray-900 dir-ltr">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-GB")
                      : t("notAvailable")}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-medium">
                    {t("orderTime") || "وقت الطلب"}:
                  </span>
                  <span className="font-semibold text-gray-900 dir-ltr">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : t("notAvailable")}
                  </span>
                </div>

                <div className={`flex items-start gap-2.5 text-sm ${(order.status === "cancelled" || order.status === "refund" || order.cancelReason || order.cancel_reason) ? "" : "sm:col-span-2"}`}>
                  <Receipt className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-500 font-medium shrink-0">
                    {t("orderNote") || "ملاحظات الطلب"}:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {order.note && order.note.trim() !== ""
                      ? order.note
                      : t("noNotes") || "لا توجد ملاحظات"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                {t("orderItems") || "مكونات الطلب"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b text-gray-500 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 text-left rtl:text-right font-semibold w-12 border-e border-gray-200/70">
                        #
                      </th>
                      <th className="px-4 py-3 text-left rtl:text-right font-semibold border-e border-gray-200/70">
                        {t("product") || "المنتج"}
                      </th>
                      <th className="px-4 py-3 text-left rtl:text-right font-semibold border-e border-gray-200/70">
                        {t("variations") || "الخيارات"}
                      </th>
                      <th className="px-4 py-3 text-left rtl:text-right font-semibold border-e border-gray-200/70">
                        {t("addOns") || "الإضافات (Add-ons)"}
                      </th>
                      <th className="px-6 py-3 text-left rtl:text-right font-semibold">
                        {t("notes") || "ملاحظات"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items?.map((item, index) => {
                      const itemAddons = item.addOns || item.addons || [];

                      return (
                        <tr
                          key={item.id || index}
                          className="hover:bg-gray-50/50 transition-colors align-top"
                        >
                          <td className="px-4 py-4 text-gray-400 font-semibold border-e border-gray-100">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 border-e border-gray-100">
                            <div className="flex flex-col items-start gap-1 min-w-[120px]">
                              <img
                                src={item.foodImage}
                                alt={item.foodName}
                                className="w-12 h-12 rounded-lg object-cover border bg-gray-50 shadow-sm flex-shrink-0 mb-1"
                              />
                              <p className="font-bold text-gray-900 text-sm">
                                {document.documentElement.dir === "rtl" &&
                                  item.foodNameAr
                                  ? item.foodNameAr
                                  : item.foodName}
                              </p>
                              <p className="text-xs font-bold text-red-700">
                                Price:{" "}
                                {parseFloat(
                                  item.totalPrice || item.unitPrice || 0,
                                ).toFixed(2)}
                              </p>
                              <p className="text-xs font-medium text-gray-600">
                                Qty: {item.quantity || item.qty || 1}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 border-e border-gray-100">
                            {item.variations && item.variations.length > 0 ? (
                              <div className="space-y-1.5">
                                {item.variations.map((v, idx) => (
                                  <div
                                    key={v.variationId || idx}
                                    className="flex flex-col text-xs bg-gray-50 border border-gray-200/60 rounded-lg px-2.5 py-1.5 w-fit shadow-2xs"
                                  >
                                    <span className="text-gray-400 font-medium">
                                      {document.documentElement.dir === "rtl"
                                        ? v.variationNameAr
                                        : v.variationName}
                                    </span>
                                    <span className="font-semibold text-gray-800">
                                      {document.documentElement.dir === "rtl"
                                        ? v.optionNameAr
                                        : v.optionName}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 border-e border-gray-100">
                            {itemAddons.length > 0 ? (
                              <div className="space-y-1.5">
                                {itemAddons.map((addon, idx) => (
                                  <div
                                    key={addon.id || idx}
                                    className="flex flex-col text-xs bg-amber-50/60 border border-amber-200/50 rounded-lg px-2.5 py-1.5 w-fit"
                                  >
                                    <span className="font-semibold text-gray-800 flex items-center justify-between gap-3">
                                      <span>
                                        {document.documentElement.dir === "rtl"
                                          ? addon.addonNameAr || addon.nameAr || addon.name
                                          : addon.addonName || addon.name}
                                      </span>
                                      <span className="text-gray-500 font-normal text-[11px]">
                                        Qty: {item.quantity || item.qty || 1}
                                      </span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs max-w-[140px]">
                            {item.note || (
                              <span className="text-gray-300">
                                {t("noNotes") || "لا توجد ملاحظات"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

<Card className="rounded-2xl border shadow-sm bg-white">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                {t("paymentSummary") || "ملخص الحساب للفاتورة"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("subtotal") || "المجموع الفرعي"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.subtotal || 0).toFixed(2)}{" "}
                  {t("currency") || "EGP"}
                </span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("serviceFee") || "رسوم الخدمة"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.serviceFee || 0).toFixed(2)}{" "}
                  {t("currency") || "EGP"}
                </span>
              </div>

              {order.orderType === "delivery" && parseFloat(order.deliveryFee) === 0 ? (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t("deliveryFee") || "رسوم التوصيل"}</span>
                  <div className="bg-primary text-black px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wide shadow-sm">
                    Free Delivery
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t("deliveryFee") || "رسوم التوصيل"}</span>
                  <span className="font-medium text-gray-900">
                    {parseFloat(order.deliveryFee || 0).toFixed(2)}{" "}
                    {t("currency") || "EGP"}
                  </span>
                </div>
              )}

              {/* --- جزء عرض قيمة الخصم (Discount Amount) --- */}
              {order.discount && parseFloat(order.discount.discountAmount) > 0 && (
                <div className="flex justify-between text-sm text-red-500 font-medium">
                  <span>
                    {t("discountAmount") || "قيمة الخصم"}
                    {order.discount.discountName && ` (${order.discount.discountName})`}
                  </span>
                  <span>
                    - {parseFloat(order.discount.discountAmount).toFixed(2)}{" "}
                    {t("currency") || "EGP"}
                  </span>
                </div>
              )}

              {/* --- جزء عرض كود الخصم (Coupon Code) مدعوم بالمسار الجديد --- */}
              {(order.couponCode || order.discount?.couponCode) && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>{t("couponCode") || "كود الخصم المستخم"}</span>
                  <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-xs font-bold uppercase">
                    {order.couponCode || order.discount?.couponCode}
                  </span>
                </div>
              )}

              {order.appCommission && parseFloat(order.appCommission) > 0 && (
                <div className="flex justify-between text-sm text-gray-500 italic">
                  <span>{t("appCommission") || "عمولة التطبيق"}</span>
                  <span>
                    {parseFloat(order.appCommission).toFixed(2)}{" "}
                    {t("currency") || "EGP"}
                  </span>
                </div>
              )}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-bold text-gray-900">
                  {t("totalAmount") || "الإجمالي الكلي"}
                </span>
                <span className="text-xl font-black text-primary">
                  {parseFloat(order.totalAmount || 0).toFixed(2)}{" "}
                  {t("currency") || "EGP"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-1">
          {/* Customer Details Card */}
          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-red-900 fill-red-900" />
              <h3 className="text-lg font-bold text-gray-900">
                {t("customer Details") || "Customer Information"}
              </h3>
            </div>

            <div className="space-y-2 text-sm text-gray-800">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">
                    {t("name") || "Name"}:
                  </span>
                  <span>{order.customer?.name || t("unknown")}</span>
                </div>

                <div className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-md shadow-2xs">
                  total orders:{" "}
                  <span className="font-bold text-gray-900">
                    {order.customer?.totalOrders ?? order.customer?.totalOrder ?? 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-gray-900">
                  {t("contact") || "Contact"}:
                </span>
                {order.customer?.phone ? (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors"
                      title="WhatsApp"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                    <span className="font-normal">{order.customer.phone}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.customer.phone);
                        toast.success(
                          t("phoneCopied") || "تم نسخ رقم الهاتف بنجاح",
                        );
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy Phone Number"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span>{t("notAvailable")}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-gray-900">
                  {t("alternatePhone") || "alternatePhone"}:
                </span>
                {order.customer?.alternatePhone ? (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${order.customer.alternatePhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors"
                      title="WhatsApp"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                    <span className="font-normal">{order.customer.alternatePhone}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.customer.alternatePhone);
                        toast.success(
                          t("phoneCopied") || "تم نسخ رقم الهاتف بنجاح",
                        );
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy Phone Number"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span>{t("notAvailable")}</span>
                )}
              </div>

              {order.customer?.email && (
                <div className="flex items-center gap-1.5 break-all">
                  <span className="font-semibold text-gray-900">
                    {t("email") || "Email"}:
                  </span>
                  <span>{order.customer.email}</span>
                </div>
              )}

              {order?.address && typeof order.address === "object" ? (
                <>
                  {order.address.title && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">
                        {t("Address") || "Address"}:
                      </span>
                      <span>{order.address.title || t("unknown")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">
                      {t("street") || "Road"}:
                    </span>
                    <span>{order.address.street || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">
                      {t("buildingNumber") || "Build Num"}:
                    </span>
                    <span>{order.address.number || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">
                      {t("floor") || "Floor"}:
                    </span>
                    <span>{order.address.floor || "-"}</span>
                  </div>
                  {order.address.apartment && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">
                        {t("apartment") || "Apartment"}:
                      </span>
                      <span>{order.address.apartment || "-"}</span>
                    </div>
                  )}
                  {order.address.landmark && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">
                        {t("landmark") || "Landmark"}:
                      </span>
                      <span className="text-gray-700">
                        {order.address.landmark}
                      </span>
                    </div>
                  )}
                  {order.address.lat && order.address.lng && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">
                        {t("locationMap") || "Location Map"}:
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${order.address.lat},${order.address.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {t("viewOnMap") || "عرض على الخريطة"}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">
                    {t("address") || "Address"}:
                  </span>
                  <span>{order?.address || t("notSpecified")}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Delivery Man Card */}
          {deliveryPerson && (
            <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-red-900 fill-red-900" />
                <h3 className="text-lg font-bold text-gray-900">
                  {t("deliveryMan") || "Delivery Man"}
                </h3>
              </div>

              <div className="space-y-2 text-sm text-gray-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-gray-900">
                    {t("name") || "Name"}:
                  </span>
                  <span>{deliveryPerson.name || t("unknown")}</span>
                </div>

                {(deliveryPerson.totalOrders !== undefined || deliveryPerson.totalOrder !== undefined) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {t("orders") || "Orders"}:
                    </span>
                    <span>{deliveryPerson.totalOrders ?? deliveryPerson.totalOrder}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-gray-900">
                    {t("contact") || "Contact"}:
                  </span>
                  {deliveryPerson.phone ? (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/${deliveryPerson.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 transition-colors"
                        title="WhatsApp"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                      <span className="font-normal">{deliveryPerson.phone}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(deliveryPerson.phone);
                          toast.success(
                            t("phoneCopied") || "تم نسخ رقم الهاتف بنجاح",
                          );
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy Phone Number"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span>{t("notAvailable")}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 break-all">
                  <span className="font-semibold text-gray-900">
                    {t("email") || "Email"}:
                  </span>
                  <span>{deliveryPerson.email || "-"}</span>
                </div>
              </div>
            </Card>
          )}

          <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {t("orderDuration") || "مدة التحضير"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500">
                  {t("remainingTime") || "الوقت المتبقي:"}
                </span>
                <PreparationCountdown
                  durationInMinutes={order.durationOrderPreparing}
                  startTime={order.createdAt}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDurationDialogOpen(true)}
                className="rounded-xl h-9 px-4 font-semibold text-xs border-primary text-primary hover:bg-primary/5 transition-colors"
              >
                {t("add") || "إضافة / تعديل"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                {t("change Order Status") || "تعديل حالة الطلب"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {orderStatuses.map((status) => {
                  const config = statusConfig[status] || {
                    icon: Info,
                    labelKey: status,
                  };
                  const IconComponent = config.icon;
                  const isActive = order.status === status;

                  const displayLabel = order.orderType === "takeaway" && status === "out_for_delivery"
                    ? "ready"
                    : config.labelKey;

                  return (
                    <Button
                      key={status}
                      variant="outline"
                      disabled={
                        updateStatusMutation.isPending ||
                        updateDurationMutation.isPending
                      }
                      onClick={() => handleStatusChange(status)}
                      className={`h-11 justify-start gap-2 rounded-xl border text-xs font-semibold relative px-3 transition-all duration-200
                      ${isActive
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm hover:bg-blue-50"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border border-white animate-pulse" />
                      )}
                      <IconComponent
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                      />
                      <span className="truncate">{t(displayLabel)}</span>
                    </Button>
                  );
                })}
              </div>

              {(order.status === "cancelled" || order.status === "refund" || order.cancelReason || order.cancel_reason) && (
                <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl flex items-start gap-2.5 text-sm mt-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-red-600 font-medium shrink-0">
                      {t("cancelReason") || "سبب الإلغاء"}:
                    </span>
                    <span className="font-semibold text-red-700">
                      {typeof (order.cancelReason || order.cancel_reason) === "object"
                        ? (document.documentElement.dir === "rtl"
                          ? (order.cancelReason?.nameAr || order.cancelReason?.name || order.cancel_reason?.nameAr || order.cancel_reason?.name)
                          : (order.cancelReason?.name || order.cancel_reason?.name))
                        : (order.cancelReason || order.cancel_reason || t("notSpecified"))}
                    </span>
                  </div>
                </div>
              )}

{["preparing", "out_for_delivery", "delivered"].includes(order.status) && (
  <div className="pt-2">
    <Button
      onClick={() => {
        if (order?.deliveryMan?.id || order?.deliveryManId) {
          setSelectedDeliveryMan(order?.deliveryMan?.id || order?.deliveryManId);
        }
        setIsAssignDialogOpen(true);
      }}
      className="w-full rounded-xl gap-2 h-11 px-5 font-semibold text-sm bg-primary hover:bg-primary/90 text-white shadow-sm transition-all flex items-center justify-between"
    >
      <div className="flex items-center gap-2 truncate">
        <Truck className="w-4 h-4 shrink-0" />
        <span className="truncate">
          {order?.deliveryMan?.name
            ? `${t("deliveryMan") || "المندوب"}: ${order.deliveryMan.name}`
            : t("assignDeliveryMan") || "تعيين مندوب توصيل"}
        </span>
      </div>

      <span className="bg-white/20 text-xs px-2.5 py-1 rounded-lg shrink-0">
        {order?.deliveryMan?.name ? (t("edit") || "Edit") : ""}
      </span>
    </Button>
  </div>
)}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={isDurationDialogOpen}
        onOpenChange={setIsDurationDialogOpen}
      >
        <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t("setPreparationTime") || "تحديد وقت التحضير"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-sm font-semibold text-gray-700 block">
              {t("durationInMinutes") || "الوقت التقديري للتحضير (بالدقائق)"}
            </label>
            <input
              type="number"
              min="1"
              value={preparationDuration}
              onChange={(e) => setPreparationDuration(e.target.value)}
              placeholder="مثال: 15"
              className="w-full h-11 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="rounded-xl px-4"
              onClick={() => {
                setIsDurationDialogOpen(false);
                setPreparationDuration("");
              }}
            >
              {t("cancel") || "إلغاء"}
            </Button>
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-white px-5 font-semibold"
              disabled={
                updateDurationMutation.isPending || !preparationDuration
              }
              onClick={() =>
                updateDurationMutation.mutate(Number(preparationDuration))
              }
            >
              {updateDurationMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              )}
              {t("confirm") || "تأكيد وبدء التحضير"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

<Dialog
        open={isAssignDialogOpen}
        onOpenChange={(open) => {
          setIsAssignDialogOpen(open);
          if (!open) {
            setDeliverySearchQuery("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              {t("assignDeliveryMan") || "تعيين مندوب توصيل"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* شريط البحث في الأعلى */}
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchDeliveryMan") || "بحث بالاسم أو رقم الهاتف..."}
                value={deliverySearchQuery}
                onChange={(e) => setDeliverySearchQuery(e.target.value)}
                className="w-full h-11 pr-10 pl-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
            </div>

            {/* قائمة عمال التوصيل */}
            {isDeliveryLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto space-y-2.5 pr-1">
                {filteredDeliveryMen.length > 0 ? (
                  filteredDeliveryMen.map((man) => {
                    const id = man.id || man._id || man.value;
                    const name = man.name || man.fullName || man.label;
                    const phone = man.phone;
                    const isSelected = selectedDeliveryMan === id;

                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedDeliveryMan(id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-2 border-primary bg-primary/5 shadow-2xs"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`text-sm font-bold ${
                              isSelected ? "text-primary" : "text-gray-900"
                            }`}
                          >
                            {name}
                          </span>
                          {phone && (
                            <span className="text-xs text-gray-500 font-medium dir-ltr text-right">
                              {phone}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-sm text-center text-gray-500 font-medium">
                    {t("noResultsFound") || "لا توجد نتائج مطابقة"}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-2">
            <Button
              variant="outline"
              className="rounded-xl px-4 h-10 font-semibold"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setSelectedDeliveryMan("");
                setDeliverySearchQuery("");
              }}
            >
              {t("cancel") || "إلغاء"}
            </Button>
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-white px-5 h-10 font-semibold"
              disabled={
                assignDeliveryMutation.isPending || !selectedDeliveryMan
              }
              onClick={handleAssignDelivery}
            >
              {assignDeliveryMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin ml-2 rtl:mr-2 rtl:ml-0" />
              )}
              {t("confirm") || "تأكيد التعيين"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isInvoiceOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsInvoiceOpen(true);
            return;
          }
          closeInvoiceDialog();
        }}
      >
        <DialogContent className="max-w-4xl rounded-2xl p-3 bg-white shadow-xl overflow-hidden">
          <div className="py-3 min-h-[70vh] flex items-center justify-center bg-slate-50 rounded-xl border overflow-hidden">
            {isInvoiceLoading ? (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>{t("loading") || "جاري التحميل..."}</span>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Order Invoice PDF"
                className="w-full h-[75vh] border-0 rounded-lg"
              />
            ) : (
              <div className="text-sm text-slate-500">
                {t("failedToDownloadInvoice") || "لم يتم تحميل الفاتورة"}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReasonDialog
        isOpen={dialogConfig.open}
        onClose={() => setDialogConfig({ open: false, type: null })}
        onConfirm={(data) =>
          updateStatusMutation.mutate({
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