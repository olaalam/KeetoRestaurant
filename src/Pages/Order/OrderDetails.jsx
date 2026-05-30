import React from 'react';
import { useParams, useNavigate } from "react-router-dom";
import {
    Clock, CheckCircle, Package, Truck, CheckCheck,
    XCircle, Ban, Undo2, MapPin, CreditCard, Store, Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from '@/api/axios';
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation"; // استيراد الهوك

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
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['orderDetails', orderId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/order/${orderId}`);
            return res.data;
        },
        enabled: !!orderId
    });

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (isError || !response?.data) {
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

    const order = response?.data?.data;
    const currentStatus = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = currentStatus.icon;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header: رقم الطلب والحالة */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("order")} #{order.orderNumber}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`px-3 py-1.5 text-sm flex items-center gap-2 ${currentStatus.color}`}>
                        <StatusIcon size={16} />
                        {t(currentStatus.labelKey)}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* العمود الأيسر: معلومات العميل والمتجر */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" /> {t("customerInfo")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="text-muted-foreground">{t("name")}</p>
                                <p className="font-medium">{order.customer?.name || t("unknown")}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">{t("phone")}</p>
                                <p className="font-medium">{order.customer?.phone || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">{t("email")}</p>
                                <p className="font-medium">{order.customer?.email || "N/A"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Store className="w-5 h-5 text-primary" /> {t("orderDetailsTitle")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("restaurant")}</span>
                                <span className="font-medium">{order.restaurant?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("branch")}</span>
                                <span className="font-medium">{order.branch?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("paymentMethod")}</span>
                                <span className="font-medium flex items-center gap-1">
                                    <CreditCard size={14} /> {order.paymentMethod}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* العمود الأيمن: المنتجات وملخص الحساب */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-primary" /> {t("orderItems")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.foodImage}
                                                    alt={item.foodName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{item.foodName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.quantity} x {t("currency")} {item.basePrice}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-bold">{t("currency")} {item.totalPrice}</p>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-6" />

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("subtotal")}</span>
                                    <span>{t("currency")} {order.subtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("deliveryFee")}</span>
                                    <span>{t("currency")} {order.deliveryFee}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("serviceFee")}</span>
                                    <span>{t("currency")} {order.serviceFee}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-base font-bold">
                                    <span>{t("totalAmount")}</span>
                                    <span className="text-primary">{t("currency")} {order.totalAmount}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            {t("backToOrders")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}