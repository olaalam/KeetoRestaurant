import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import {
    Clock, CheckCircle, Package, Truck, CheckCheck,
    XCircle, Ban, Undo2, MapPin, CreditCard, Store, Receipt,
    Eye, Loader2, AlertCircle, ShieldAlert, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from '@/api/axios';
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const statusConfig = {
    pending: { labelKey: "pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
    accepted: { labelKey: "accepted", color: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle },
    preparing: { labelKey: "preparing", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Package },
    out_for_delivery: { labelKey: "out_for_delivery", color: "bg-orange-100 text-orange-800 border-orange-200", icon: Truck },
    delivered: { labelKey: "delivered", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCheck },
    cancelled: { labelKey: "cancelled", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    rejected: { labelKey: "rejected", color: "bg-red-100 text-red-800 border-red-200", icon: Ban },
    refund: { labelKey: "refund", color: "bg-gray-100 text-gray-800 border-gray-200", icon: Undo2 },
};

export default function OrderDetails() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { t, isRTL } = useTranslation();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['orderDetails', orderId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/order/${orderId}`);
            return res.data;
        },
        enabled: !!orderId
    });

    // دالة جلب ومعاينة الفاتورة قبل التحميل
    const handlePreviewInvoice = async () => {
        try {
            setIsPdfLoading(true);
            setIsPreviewOpen(true);

            const response = await api.get(`/api/restaurant/order/${orderId}/invoice`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            setPdfUrl(url);
            setIsPdfLoading(false);
        } catch (error) {
            console.error("Failed to fetch invoice PDF:", error);
            toast.error(t("downloadErrorAlert") || "فشل تحميل ملف الفاتورة");
            setIsPreviewOpen(false);
            setIsPdfLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (isError || !response?.data?.data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <XCircle className="w-10 h-10 text-red-500" />
                <h2 className="text-xl font-bold">{t("orderNotFound")}</h2>
                <p className="text-muted-foreground">{t("couldNotLoadOrderDetails")}</p>
                <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                    {t("goBack")}
                </Button>
            </div>
        );
    }

    const order = response.data.data;
    const currentStatus = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = currentStatus.icon;

    // تحديد اسم طريقة الدفع بناءً على لغة واجهة المستخدم المتاحة
    const displayPaymentMethod = isRTL 
        ? (order.paymentMethodNameAr || order.paymentMethodName || order.paymentMethod || t("notSpecified")) 
        : (order.paymentMethodName || order.paymentMethod || t("notSpecified"));

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
            
            {/* سبب الإلغاء إذا كان الطلب ملغى */}
            {order.status === 'cancelled' && order.cancelReason && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start gap-3 shadow-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                    <div>
                        <h5 className="font-bold text-sm">{t("cancelReasonTitle") || "سبب إلغاء الطلب:"}</h5>
                        <p className="text-sm mt-0.5 whitespace-pre-line">{order.cancelReason}</p>
                    </div>
                </div>
            )}

            {/* Header: رقم الطلب والحالة والتواريخ */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold tracking-tight">{t("order")} #{order.orderNumber}</h1>
                        <Badge variant="secondary" className="text-xs uppercase bg-slate-100">
                            {order.orderSource ? t(order.orderSource) : order.orderSource}
                        </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-muted-foreground text-xs mt-1.5">
                        <p>{t("createdAt") || "تاريخ الإنشاء:"} {new Date(order.createdAt).toLocaleString()}</p>
                        {order.updatedAt && (
                            <p>{t("updatedAt") || "آخر تحديث:"} {new Date(order.updatedAt).toLocaleString()}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewInvoice}
                        disabled={isPdfLoading}
                        className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9"
                    >
                        {isPdfLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Eye size={16} />
                        )}
                        {t("showInvoice") || "عرض الفاتورة"}
                    </Button>

                    <Badge variant="outline" className={`px-3 py-1.5 text-sm flex items-center gap-2 font-semibold shadow-sm ${currentStatus.color}`}>
                        <StatusIcon size={16} />
                        {t(currentStatus.labelKey)}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* العمود الأيسر: معلومات العميل والمتجر */}
                <div className="md:col-span-1 space-y-6">
                    {/* معلومات العميل */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> {t("customerInfo")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3.5 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs">{t("name")}</p>
                                <p className="font-medium mt-0.5">{order.customer?.name || t("unknown")}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">{t("phone")}</p>
                                <p className="font-medium mt-0.5 dir-ltr inline-block">{order.customer?.phone || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">{t("email")}</p>
                                <p className="font-medium mt-0.5 break-all">{order.customer?.email || "N/A"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* تفاصيل الفرع وطبيعة الطلب */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Store className="w-4 h-4 text-primary" /> {t("orderDetailsTitle")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                                <span className="text-muted-foreground">{t("restaurant")}</span>
                                <span className="font-medium">{order.restaurant?.name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                                <span className="text-muted-foreground">{t("branch")}</span>
                                <span className="font-medium">{order.branch?.name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                                <span className="text-muted-foreground">{t("orderType")}</span>
                                <Badge variant="outline" className="font-medium capitalize bg-slate-50">
                                    {t(order.orderType) || order.orderType}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                                <span className="text-muted-foreground">{t("paymentMethod")}</span>
                                <span className="font-medium flex items-center gap-1 text-xs">
                                    <CreditCard size={13} className="text-slate-400" /> {displayPaymentMethod}
                                </span>
                            </div>
                            {order.note && (
                                <div className="pt-1">
                                    <span className="text-muted-foreground block text-xs mb-1">{t("note")}</span>
                                    <div className="bg-slate-50 p-2 rounded text-xs border text-slate-600 italic">
                                        {order.note}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* العمود الأيمن: المنتجات وملخص الحساب */}
                <div className="md:col-span-2 space-y-6">
                    {/* وجبات الطلب */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-primary" /> {t("orderItems")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0 gap-4">
                                        <div className="flex items-start gap-3.5">
                                            <div className="w-14 h-14 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border shadow-sm">
                                                <img
                                                    src={item.foodImage}
                                                    alt={isRTL ? item.foodNameAr : item.foodName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = '/placeholder-food.png' }}
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-sm text-slate-900">
                                                    {isRTL ? (item.foodNameAr || item.foodName) : item.foodName}
                                                </p>
                                                {item.foodDescription && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                                                        {item.foodDescription}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500 font-medium pt-1">
                                                    {item.quantity} × {t("currency")} {parseFloat(item.basePrice).toFixed(2)}
                                                </p>
                                                
                                                {/* عرض الإضافات والمكونات إذا وجدت */}
                                                {item.variations && (
                                                    <p className="text-[11px] text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded inline-block mt-1">
                                                        {item.variations} (+{t("currency")} {parseFloat(item.variationsPrice).toFixed(2)})
                                                    </p>
                                                )}
                                                
                                                {item.note && (
                                                    <p className="text-[11px] text-amber-600 italic block mt-0.5">
                                                        * {item.note}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-end shrink-0">
                                            <p className="font-bold text-sm text-slate-800">
                                                {t("currency")} {parseFloat(item.totalPrice).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-5" />

                            {/* تفاصيل ملخص الحساب بالكامل */}
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span className="text-muted-foreground">{t("subtotal")}</span>
                                    <span className="font-medium">{t("currency")} {parseFloat(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span className="text-muted-foreground">{t("deliveryFee")}</span>
                                    <span className="font-medium">{t("currency")} {parseFloat(order.deliveryFee).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span className="text-muted-foreground">{t("serviceFee")}</span>
                                    <span className="font-medium">{t("currency")} {parseFloat(order.serviceFee).toFixed(2)}</span>
                                </div>
                                
                                {/* حقل عمولة التطبيق الجديد */}
                                {order.appCommission && parseFloat(order.appCommission) > 0 && (
                                    <div className="flex justify-between text-slate-500 text-xs italic bg-slate-50/50 p-1.5 rounded border border-dashed">
                                        <span className="flex items-center gap-1">
                                            <AlertCircle size={12} /> {t("appCommission") || "عمولة التطبيق (مضمنة):"}
                                        </span>
                                        <span>{t("currency")} {parseFloat(order.appCommission).toFixed(2)}</span>
                                    </div>
                                )}
                                
                                <Separator className="my-2" />
                                <div className="flex justify-between text-base font-black pt-1">
                                    <span>{t("totalAmount")}</span>
                                    <span className="text-primary text-lg">{t("currency")} {parseFloat(order.totalAmount).toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* أزرار التحكم بالرجوع والمعاينة */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => navigate(-1)} className="h-10">
                            {t("backToOrders")}
                        </Button>

                        <Button
                            onClick={handlePreviewInvoice}
                            disabled={isPdfLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 h-10"
                        >
                            {isPdfLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" /> {t("loadingInvoice") || "جاري التحميل..."}</>
                            ) : (
                                <><Eye className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t("showInvoice") || "عرض الفاتورة"}</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* نافذة معاينة الفاتورة المدبجة */}
            <Dialog
                open={isPreviewOpen}
                onOpenChange={(open) => {
                    setIsPreviewOpen(open);
                    if (!open && pdfUrl) {
                        window.URL.revokeObjectURL(pdfUrl);
                        setPdfUrl(null);
                    }
                }}
            >
                <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{t("invoicePreview") || "معاينة الفاتورة"}</DialogTitle>
                        <DialogDescription>
                            {t("previewInvoiceDesc") || "يمكنك مراجعة تفاصيل الفاتورة أو طباعتها مباشرة من هنا."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 w-full h-full bg-gray-50 rounded-md overflow-hidden relative border">
                        {isPdfLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">{t("loadingInvoice") || "جاري تجهيز الفاتورة..."}</p>
                            </div>
                        ) : pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full border-none"
                                title="Invoice Preview"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                {t("noInvoiceAvailable") || "لا توجد فاتورة متاحة للعرض"}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}