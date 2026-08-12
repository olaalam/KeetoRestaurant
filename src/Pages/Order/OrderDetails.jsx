import React, { useState } from "react";
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
} from "@/components/ui/dialog"; // استيراد الـ Dialog هنا
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

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [dialogConfig, setDialogConfig] = useState({ open: false, type: null });
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false); // State للتحكم في فتح وإغلاق الفاتورة

  const orderStatuses = [
    "pending",
    "accepted",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refund",
  ];

  // جلب تفاصيل الطلب
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

  // جلب قائمة الطلبات لتحديد الطلب السابق والتالي
  const { data: ordersList = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get(`/api/restaurant/order`);
      return res.data?.data?.data || res.data?.data || [];
    },
  });

  const currentOrderIndex = ordersList.findIndex((o) => o.id === orderId);
  const previousOrder =
    currentOrderIndex > 0 ? ordersList[currentOrderIndex - 1] : null;
  const nextOrder =
    currentOrderIndex !== -1 && currentOrderIndex < ordersList.length - 1
      ? ordersList[currentOrderIndex + 1]
      : null;

  // ميوتيشن تحديث الحالة
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, cancelReasonId }) => {
      const res = await api.put(`/api/restaurant/order/${orderId}`, {
        status,
        cancelReasonId,
      });
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

  const handleStatusChange = (newStatus) => {
    if (newStatus === "cancelled" || newStatus === "refund") {
      setDialogConfig({ open: true, type: newStatus });
    } else {
      updateStatusMutation.mutate({ status: newStatus });
    }
  };

  // دالة لطباعة الفاتورة مباشرة من الـ Dialog
  const handlePrintInvoice = () => {
    const printContent =
      document.getElementById("invoice-print-area")?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
      document.body.innerHTML = printContent;
      window.print();
      window.location.reload(); // لإعادة تحميل الصفحة واستعادة العناصر الأصلية
    }
  };

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

  return (
    <div className="w-full mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border shadow-sm">
        
        {/* الجزء الأيسر: زر العودة، رقم الطلب، الشارات المعبرة */}
        {/* كل العناصر هنا موحدة بارتفاع h-11 عشان تبقى متناسبة مع بعض */}
        <div className="flex flex-1 items-center gap-3 flex-wrap w-full">
<Button
  size="icon"
  className="w-12 h-12 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-none shadow-sm shrink-0 transition-all"
  onClick={() => navigate("/orders")}
>
  <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
</Button>
          {/* رقم الطلب اليومي بشكل واضح وموحد الارتفاع مع باقي العناصر */}
<div className="flex items-center justify-center gap-1.5 min-w-[3rem] bg-gray-100/80 px-3 py-1.5 rounded-xl border border-gray-200/80 shrink-0">

  <span className="text-xs font-bold text-gray-500 uppercase">

    Order #

  </span>

  <span className="text-xl font-black text-gray-900 tracking-tight">

    {order.dailyOrderNumber}

  </span>

</div>

          <Separator orientation="vertical" className="h-8 hidden sm:block bg-gray-200" />

          {/* مصفوفة الشارات (Badges) - كلها بنفس الارتفاع h-11 وحجم خط موحد text-sm */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1. حالة الطلب */}
            <Badge
              className={`${currentStatusStyle.color} h-11 font-bold rounded-xl border px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none`}
            >
              <StatusIcon className="w-4 h-4" />
              {t(currentStatusStyle.labelKey)}
            </Badge>

            {/* 2. نوع الطلب (Takeaway / Delivery / Dine-in) */}
            {order.orderType && (
              <Badge
                variant="outline"
                className="bg-amber-50/70 border-amber-200 text-amber-800 h-11 font-semibold rounded-xl px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none"
              >
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span className="capitalize">{order.orderType}</span>
              </Badge>
            )}

            {/* 3. مصدر الطلب (Online Order / POS) */}
            {order.orderSource && (
              <Badge
                variant="outline"
                className="bg-blue-50/70 border-blue-200 text-blue-800 h-11 font-semibold rounded-xl px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none"
              >
                <Store className="w-4 h-4 text-blue-600" />
                <span className="capitalize">{order.orderSource?.replace(/_/g, " ")}</span>
              </Badge>
            )}

            {/* 4. طريقة الدفع (Cash on Delivery / Online / Card) */}
            {(order.paymentMethodName || order.paymentMethodNameAr) && (
              <Badge
                variant="outline"
                className="bg-emerald-50/70 border-emerald-200 text-emerald-800 h-11 font-semibold rounded-xl px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="capitalize">
                  {document.documentElement.dir === "rtl" && order.paymentMethodNameAr
                    ? order.paymentMethodNameAr
                    : order.paymentMethodName?.replace(/_/g, " ")}
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* الجزء الأيمن: أزرار التنقل بين الطلبات وزر الفاتورة */}
        {/* نفس الارتفاع h-11 لكل الأزرار عشان تبقى متساوية مع الشارات والبوكس */}
        <div className="flex items-center gap-3 w-full lg:w-auto lg:justify-end shrink-0 pt-2 lg:pt-0">
          {/* أزرار التنقل بين الطلب السابق والتالي */}
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

          {/* زر فتح الفاتورة */}
          <Button
            onClick={() => setIsInvoiceOpen(true)}
            className="rounded-xl gap-2 h-11 px-5 font-semibold text-sm bg-primary text-white shadow-sm hover:bg-primary/90"
          >
            <Receipt className="w-4 h-4" />
            {t("viewInvoice") || "عرض الفاتورة"}
          </Button>
        </div>
      </div>

      {/* شبكة البيانات الأساسية */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">

          {/* كارت تفاصيل الطلب الأساسية (رقم الطلب - التاريخ - النوع - المصدر - الفرع - طريقة الدفع - ملاحظات) */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {t("orderDetails") || "تفاصيل الطلب"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

                <div className="flex items-center gap-2.5 text-sm">
                  <Store className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-medium">
                    {t("branch") || "الفرع"}:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {order.branch?.name || order.restaurant?.name || t("notAvailable")}
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
                      ? new Date(order.createdAt).toLocaleDateString()
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
                      ? new Date(order.createdAt).toLocaleTimeString()
                      : t("notAvailable")}
                  </span>
                </div>

                {order.note && (
                  <div className="flex items-start gap-2.5 text-sm sm:col-span-2">
                    <Receipt className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-gray-500 font-medium shrink-0">
                      {t("orderNote") || "ملاحظات الطلب"}:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {order.note}
                    </span>
                  </div>
                )}
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
            {/* عمود الـ Add-ons الجديد */}
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
            // دعم لمسميات المصفوفتين سواء كانت addOns أو addons
            const itemAddons = item.addOns || item.addons || [];

            return (
              <tr
                key={item.id || index}
                className="hover:bg-gray-50/50 transition-colors align-top"
              >
                {/* 1. الرقم */}
                <td className="px-4 py-4 text-gray-400 font-semibold border-e border-gray-100">
                  {index + 1}
                </td>

                {/* 2. المنتج */}
<td className="px-4 py-4 border-e border-gray-100">
  <div className="flex flex-col items-start gap-1 min-w-[120px]">
    {/* صورة المنتج */}
    <img
      src={item.foodImage}
      alt={item.foodName}
      className="w-12 h-12 rounded-lg object-cover border bg-gray-50 shadow-sm flex-shrink-0 mb-1"
    />

    {/* اسم المنتج */}
    <p className="font-bold text-gray-900 text-sm">
      {item.foodName}
    </p>

    {/* السعر */}
    <p className="text-xs font-bold text-red-700">
      Price: {parseFloat(item.basePrice || item.unitPrice || 0).toFixed(2)}
    </p>

    {/* الكمية */}
    <p className="text-xs font-medium text-gray-600">
      Qty: {item.quantity || item.qty || 1}
    </p>
  </div>
</td>

                {/* 3. الخيارات (Variations) */}
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
                            {parseFloat(v.additionalPrice) > 0 && (
                              <span className="text-primary font-bold">
                                {" "}
                                +{parseFloat(v.additionalPrice).toFixed(2)}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* 4. الإضافات (Add-ons) */}
                <td className="px-4 py-4 border-e border-gray-100">
                  {itemAddons.length > 0 ? (
                    <div className="space-y-1.5">
                      {itemAddons.map((addon, idx) => (
                        <div
                          key={addon.id || idx}
                          className="flex flex-col text-xs bg-amber-50/60 border border-amber-200/50 rounded-lg px-2.5 py-1.5 w-fit"
                        >
                          <span className="font-semibold text-gray-800">
                            {document.documentElement.dir === "rtl"
                              ? addon.addonNameAr || addon.nameAr || addon.name
                              : addon.addonName || addon.name}
                            {parseFloat(addon.price || addon.additionalPrice || 0) > 0 && (
                              <span className="text-primary font-bold">
                                {" "}
                                +{parseFloat(addon.price || addon.additionalPrice).toFixed(2)}
                              </span>
                            )}
                          </span>
                          {addon.quantity && addon.quantity > 1 && (
                            <span className="text-gray-400 text-[10px]">
                              الكمية: {addon.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* 5. الملاحظات */}
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
                  {parseFloat(order.subtotal).toFixed(2)}{" "}
                  {t("currency") || "EGP"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("serviceFee") || "رسوم الخدمة"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.serviceFee).toFixed(2)}{" "}
                  {t("currency") || "EGP"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("deliveryFee") || "رسوم التوصيل"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.deliveryFee).toFixed(2)}{" "}
                  {t("currency") || "EGP"}
                </span>
              </div>
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
                  {parseFloat(order.totalAmount).toFixed(2)}{" "}
                  {t("currency") || "EGP"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* العمود الأيمن: التحكم بالحالات وبيانات العميل */}
        <div className="space-y-6">
          {/* العمود الأيسر: محتويات الفاتورة والمنتجات */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-red-900 fill-red-900" />
                <h3 className="text-lg font-bold text-gray-900">
                  {t("customerDetails") || "Customer Information"}
                </h3>
              </div>

              {/* Content - Stacked Items */}
              <div className="space-y-2 text-sm text-gray-800">
                {/* Name */}
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">{t("name") || "Name"}:</span>
                  <span>{order.customer?.name || t("unknown")}</span>
                </div>

                {/* Contact (Phone, WhatsApp, Copy) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-gray-900">{t("contact") || "Contact"}:</span>
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
                          toast.success(t("phoneCopied") || "تم نسخ رقم الهاتف بنجاح");
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

                {/* Email */}
                {order.customer?.email && (
                  <div className="flex items-center gap-1.5 break-all">
                    <span className="font-semibold text-gray-900">{t("email") || "Email"}:</span>
                    <span>{order.customer.email}</span>
                  </div>
                )}

                {/* Address Details - Listed Line by Line */}
                {order?.address && typeof order.address === "object" ? (
                  <>
                    {/* Title / Full Address Text */}
                    {order.address.title && (

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900">{t("Address") || "Address"}:</span>
                        <span> {order.address.title || t("unknown")}</span>
                      </div>
                    )}
                    {/* Street / Road */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">{t("street") || "Road"}:</span>
                      <span>{order.address.street || "-"}</span>
                    </div>

                    {/* Building Number */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">{t("buildingNumber") || "Build Num"}:</span>
                      <span>{order.address.number || "-"}</span>
                    </div>

                    {/* Floor */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">{t("floor") || "Floor"}:</span>
                      <span>{order.address.floor || "-"}</span>
                    </div>



                    {/* Landmark */}
                    {order.address.landmark && (
                      <div className="text-gray-700">
                        {order.address.landmark}
                      </div>
                    )}

                    {/* Map Link */}
                    {order.address.lat && order.address.lng && (

                      <a

                        href={`https://www.google.com/maps?q=${order.address.lat},${order.address.lng}`}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline rtl:pr-6 ltr:pl-6"

                      >


                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900">{t("Address") || "Address"}:</span>
                          <span>                         <MapPin className="w-3.5 h-3.5" />

                            {t("viewOnMap") || "عرض على الخريطة"}
                          </span>
                        </div>
                      </a>

                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">{t("address") || "Address"}:</span>
                    <span>{order?.address || t("notSpecified")}</span>
                  </div>
                )}
              </div>
            </Card>


          </div>
          <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                {t("changeOrderStatus") || "تعديل حالة الطلب"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-2.5">
              {orderStatuses.map((status) => {
                const config = statusConfig[status] || {
                  icon: Info,
                  labelKey: status,
                };
                const IconComponent = config.icon;
                const isActive = order.status === status;

                return (
                  <Button
                    key={status}
                    variant="outline"
                    disabled={updateStatusMutation.isPending}
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
                    <span className="truncate">{t(config.labelKey)}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* مكوّن الـ Dialog الخاص بعرض وتصميم الفاتورة */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-xl overflow-hidden sm:max-w-lg">
          <DialogHeader className="flex flex-row justify-between items-center border-b pb-4">
            <DialogTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              {t("orderInvoice") || "فاتورة الطلب"}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintInvoice}
              className="rounded-xl gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              {t("print") || "طباعة"}
            </Button>
          </DialogHeader>

          {/* منطقة الفاتورة القابلة للطباعة والتصفح */}
          <div
            id="invoice-print-area"
            className="py-4 space-y-4 max-h-[70vh] overflow-y-auto px-1"
          >
            {/* ترويسة الفاتورة */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-gray-900 capitalize">
                {order.restaurant?.name || "Keeto"}
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                {order.branch?.name}
              </p>
              <p className="text-xs text-gray-500 dir-ltr">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <Separator className="border-dashed" />

            {/* بيانات الفاتورة الأساسية */}
            <div className="text-xs space-y-2 text-gray-600 bg-gray-50 p-3 rounded-xl border">
              <div className="flex justify-between">
                <span className="font-medium">
                  {t("invoiceNo") || "رقم الفاتورة"}:
                </span>
                <span className="font-bold text-gray-900">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">
                  {t("dailyNo") || "الرقم اليومي"}:
                </span>
                <span className="font-bold text-gray-900">
                  #{order.dailyOrderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">
                  {t("customerName") || "اسم العميل"}:
                </span>
                <span className="font-semibold text-gray-900">
                  {order.customer?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">
                  {t("paymentMethod") || "طريقة الدفع"}:
                </span>
                <span className="font-semibold text-gray-900">
                  {order.paymentMethodNameAr || order.paymentMethodName}
                </span>
              </div>
            </div>

            <Separator className="border-dashed" />

            {/* جدول أو قائمة المنتجات */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-400 px-1">
                <span>{t("item") || "الصنف"}</span>
                <span>{t("total") || "الإجمالي"}</span>
              </div>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between items-start text-sm gap-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-gray-900">
                          {item.foodName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.quantity} ×{" "}
                          {parseFloat(item.basePrice).toFixed(2)}{" "}
                          {t("currency") || "EGP"}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900 shrink-0">
                        {parseFloat(item.totalPrice).toFixed(2)}
                      </span>
                    </div>

                    {/* طباعة الإضافات في الفاتورة */}
                    {item.variations && item.variations.length > 0 && (
                      <div className="rtl:pr-4 ltr:pl-4 text-xs text-gray-500 space-y-0.5 border-r-2 rtl:border-gray-200 ltr:border-l-2">
                        {item.variations.map((v, idx) => (
                          <div
                            key={v.variationId || idx}
                            className="flex justify-between"
                          >
                            <span>
                              {document.documentElement.dir === "rtl"
                                ? v.variationNameAr
                                : v.variationName}
                              :{" "}
                              {document.documentElement.dir === "rtl"
                                ? v.optionNameAr
                                : v.optionName}
                            </span>
                            {parseFloat(v.additionalPrice) > 0 && (
                              <span>
                                +{parseFloat(v.additionalPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator className="border-dashed" />

            {/* ملخص الحساب النهائي داخل الفاتورة */}
            <div className="space-y-2 text-sm bg-gray-50/50 p-3 rounded-xl border">
              <div className="flex justify-between text-gray-600 text-xs">
                <span>{t("subtotal") || "المجموع الفرعي"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 text-xs">
                <span>{t("serviceFee") || "رسوم الخدمة"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.serviceFee).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 text-xs">
                <span>{t("deliveryFee") || "رسوم التوصيل"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.deliveryFee).toFixed(2)}
                </span>
              </div>
              <Separator className="my-1 border-gray-200" />
              <div className="flex justify-between items-center pt-0.5">
                <span className="font-bold text-gray-900">
                  {t("totalAmount") || "الإجمالي النهائي"}
                </span>
                <span className="text-lg font-black text-primary">
                  {parseFloat(order.totalAmount).toFixed(2)}{" "}
                  {t("currency") || "EGP"}
                </span>
              </div>
            </div>

            {/* تذييل شكر الفاتورة */}
            {/* <div className="text-center pt-2">
                            <p className="text-xs text-gray-400 font-medium">شكرًا لتعاملكم معنا!</p>
                        </div> */}
          </div>
        </DialogContent>
      </Dialog>

      <ReasonDialog
        isOpen={dialogConfig.open}
        onClose={() => setDialogConfig({ open: false, type: null })}
        onConfirm={(cancelReasonId) =>
          updateStatusMutation.mutate({
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