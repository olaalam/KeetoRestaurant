import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Clock, CheckCircle, Package, Truck, CheckCheck,
    XCircle, Undo2, MapPin, CreditCard, Store, Receipt, HomeIcon,
    ArrowLeft, User, Phone, Mail, Calendar, Hash, Info, ShoppingBag, 
    Loader2, Copy // تم استيراد أيقونة النسخ هنا
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from '@/api/axios';
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from 'sonner';
import ReasonDialog from './ReasonDialog';

const statusConfig = {
    pending: { labelKey: "pending", color: "border-amber-500 bg-amber-50 text-amber-700", icon: Clock },
    accepted: { labelKey: "accepted", color: "border-blue-500 bg-blue-50 text-blue-700", icon: CheckCircle },
    preparing: { labelKey: "preparing", color: "border-purple-500 bg-purple-50 text-purple-700", icon: Package },
    out_for_delivery: { labelKey: "outForDelivery", color: "border-indigo-500 bg-indigo-50 text-indigo-700", icon: Truck },
    delivered: { labelKey: "delivered", color: "border-green-500 bg-green-50 text-green-700", icon: CheckCheck },
    cancelled: { labelKey: "cancelled", color: "border-red-500 bg-red-50 text-red-700", icon: XCircle },
    refund: { labelKey: "refund", color: "border-gray-500 bg-gray-50 text-gray-700", icon: Undo2 },
};

export default function OrderDetails() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [dialogConfig, setDialogConfig] = useState({ open: false, type: null });

    const orderStatuses = [
        "pending", "accepted", "preparing", "out_for_delivery",
        "delivered", "cancelled", "refund"
    ];

    // جلب تفاصيل الطلب
    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/order/${orderId}`);
            return res.data?.data?.data || res.data?.data;
        },
        enabled: !!orderId
    });

    // ميوتيشن تحديث الحالة
    const updateStatusMutation = useMutation({
        mutationFn: async ({ status, cancelReasonId }) => {
            const res = await api.put(`/api/restaurant/order/${orderId}`, { status, cancelReasonId });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['order', orderId]);
            queryClient.invalidateQueries(['orders']);
            toast.success(t('statusUpdatedSuccess') || 'تم تحديث حالة الطلب بنجاح');
            setDialogConfig({ open: false, type: null });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || t('statusUpdateError') || 'فشل في تحديث الحالة');
        }
    });

    const handleStatusChange = (newStatus) => {
        if (newStatus === 'cancelled' || newStatus === 'refund') {
            setDialogConfig({ open: true, type: newStatus });
        } else {
            updateStatusMutation.mutate({ status: newStatus });
        }
    };

    if (isLoading) return <div className="min-h-[400px] flex items-center justify-center"><LoadingSpinner /></div>;
    if (error || !order) return <div className="text-center p-8 text-red-500">{t('orderNotFound') || 'الطلب غير موجود'}</div>;

    const StatusIcon = statusConfig[order.status]?.icon || Info;
    const currentStatusStyle = statusConfig[order.status] || { color: "border-gray-200 bg-gray-100 text-gray-800", labelKey: order.status };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
            


            {/* شبكة البيانات الأساسية */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* العمود الأيسر: محتويات الفاتورة والمنتجات */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl border shadow-sm overflow-hidden bg-white">
                        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                {t('orderItems') || 'مكونات الطلب'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y">
                            {order.items?.map((item) => (
                                <div key={item.id} className="p-6 flex items-start justify-between gap-4 hover:bg-gray-50/30 transition-colors">
                                    <div className="flex gap-4">
                                        <img 
                                            src={item.foodImage}
                                            alt={item.foodName}
                                            className="w-16 h-16 rounded-xl object-cover border bg-gray-50 shadow-sm flex-shrink-0" 
                                        />
                                        <div className="space-y-1">
                                            <h4 className="font-semibold text-gray-900 text-base">
                                                {item.foodName}
                                            </h4>
                                            {item.foodDescription && (
                                                <p className="text-xs text-gray-400 max-w-md line-clamp-2">{item.foodDescription}</p>
                                            )}
                                            <p className="text-sm text-gray-600 font-medium">
                                                {t('quantity') || 'الكمية'}: <span className="text-primary font-bold">{item.quantity}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col justify-center h-16">
                                        <span className="text-base font-bold text-gray-900">{parseFloat(item.totalPrice).toFixed(2)} {t('currency') || 'EGP'}</span>
                                        {item.quantity > 1 && (
                                            <span className="text-xs text-gray-400">{parseFloat(item.basePrice).toFixed(2)} / {t('unit')}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border shadow-sm bg-white">
                        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-primary" />
                                {t('paymentSummary') || 'ملخص الحساب للفاتورة'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3.5">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>{t('subtotal') || 'المجموع الفرعي'}</span>
                                <span className="font-medium text-gray-900">{parseFloat(order.subtotal).toFixed(2)} {t('currency') || 'EGP'}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>{t('serviceFee') || 'رسوم الخدمة'}</span>
                                <span className="font-medium text-gray-900">{parseFloat(order.serviceFee).toFixed(2)} {t('currency') || 'EGP'}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>{t('deliveryFee') || 'رسوم التوصيل'}</span>
                                <span className="font-medium text-gray-900">{parseFloat(order.deliveryFee).toFixed(2)} {t('currency') || 'EGP'}</span>
                            </div>
                            {order.appCommission && parseFloat(order.appCommission) > 0 && (
                                <div className="flex justify-between text-sm text-gray-500 italic">
                                    <span>{t('appCommission') || 'عمولة التطبيق'}</span>
                                    <span>{parseFloat(order.appCommission).toFixed(2)} {t('currency') || 'EGP'}</span>
                                </div>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-base font-bold text-gray-900">{t('totalAmount') || 'الإجمالي الكلي'}</span>
                                <span className="text-xl font-black text-primary">{parseFloat(order.totalAmount).toFixed(2)} {t('currency') || 'EGP'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* العمود الأيمن: التحكم بالحالات وبيانات العميل */}
                <div className="space-y-6">
                    <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" />
                                {t('changeOrderStatus') || 'تعديل حالة الطلب'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-2.5">
                            {orderStatuses.map((status) => {
                                const config = statusConfig[status] || { icon: Info, labelKey: status };
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
                                        <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                                        <span className="truncate">{t(config.labelKey)}</span>
                                    </Button>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* كارت بيانات العميل المحدث مع أيقونة الـ WhatsApp والنسخ المباشر */}
                    <Card className="rounded-2xl border shadow-sm bg-white">
                        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                {t('customerDetails') || 'بيانات العميل'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                    {order.customer?.name?.charAt(0).toUpperCase() || 'C'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{order.customer?.name || t('unknown')}</p>
                                    <p className="text-xs text-gray-400">{t('customer')}</p>
                                </div>
                            </div>
                            <Separator className="bg-gray-100" />
                            <div className="space-y-3">
                                <div className="flex items-center justify-between w-full text-sm text-gray-600">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-500 font-medium">{t('contact') || 'Contact'}:</span>
                                        
                                        {/* أيقونة الواتساب المضافة بجانب الرقم */}
                                        {order.customer?.phone && (
                                            <a 
                                                href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-green-600 hover:text-green-700 transition-colors mx-0.5"
                                                title="WhatsApp"
                                            >
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                </svg>
                                            </a>
                                        )}

                                        <span className="font-semibold text-gray-900">{order.customer?.phone || t('notAvailable')}</span>

                                        {/* زر نسخ رقم الهاتف المضاف مع التنبيه الفوري */}
                                        {order.customer?.phone && (
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(order.customer.phone);
                                                    toast.success(t('phoneCopied') || 'تم نسخ رقم الهاتف بنجاح');
                                                }}
                                                className="inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors ml-1.5"
                                                title="Copy Phone Number"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {order.customer?.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 break-all">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span>{order.customer?.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>{order?.address || t('notSpecified')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border shadow-sm bg-white">
                        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <Store className="w-5 h-5 text-primary" />
                                {t('fulfillmentInfo') || 'تفاصيل التنفيذ'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-xl border">
                                    <span className="text-xs text-gray-400 block mb-0.5">{t('orderType') || 'نوع الطلب'}</span>
                                    <span className="text-sm font-bold text-gray-800 capitalize">{order.orderType}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border">
                                    <span className="text-xs text-gray-400 block mb-0.5">{t('orderSource') || 'مصدر الطلب'}</span>
                                    <span className="text-sm font-bold text-gray-800 capitalize">{order.orderSource?.replace('_', ' ')}</span>
                                </div>
                            </div>

                            <Separator className="bg-gray-100" />

                            <div className="space-y-2.5">
                                <div className="flex items-start gap-2.5 text-sm text-gray-600">
                                    <Store className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900">{order.branch?.name}</span>
                                        <span className="text-xs text-gray-400 block">{t('branch') || 'الفرع المسؤول'}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5 text-sm text-gray-600">
                                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900">#{order.dailyOrderNumber}</span>
                                        <span className="text-xs text-gray-400 block">{t('dailyOrderNumber') || 'رقم الطلب اليومي'}</span>
                                    </div>
                                </div>
                            </div>

                            {order.cancelReason && (
                                <>
                                    <Separator className="bg-gray-100" />
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                        <span className="text-xs font-bold text-red-700 block mb-1">{t('cancelReason') || 'سبب الإلغاء/الرفض'}:</span>
                                        <p className="text-sm text-red-600 whitespace-pre-line">{order.cancelReason}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ReasonDialog 
                isOpen={dialogConfig.open}
                onClose={() => setDialogConfig({ open: false, type: null })}
                onConfirm={(cancelReasonId) => updateStatusMutation.mutate({ 
                    status: dialogConfig.type, 
                    cancelReasonId 
                })}
                title={dialogConfig.type === 'cancelled' ? t("cancelOrder") : t("rejectOrder")}
            />
        </div>
    );
}