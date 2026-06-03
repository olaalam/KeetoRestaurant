import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Loader2, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";

export default function Order() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const orderStatuses = [
        "pending", "accepted", "preparing", "out_for_delivery",
        "delivered", "cancelled", "rejected", "refund"
    ];

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/order`);
            return res.data.data.data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status, reason }) => {
            const payload = { status };
            if (reason) payload.cancelReason = reason;
            const { data } = await api.put(`/api/restaurant/order/${orderId}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
            toast.success(t("orderStatusUpdatedSuccessfully"));
            setCancelDialogOpen(false);
            setCancelReason("");
            setSelectedOrderId(null);
        },
        onError: (error) => {
            const serverErrorMessage = error?.response?.data?.error?.message || t("failedToUpdateStatus");
            toast.error(serverErrorMessage);
            console.error("Update Error:", error);
        }
    });

    const handleStatusChange = (orderId, newStatus) => {
        if (newStatus === 'cancelled') {
            setSelectedOrderId(orderId);
            setCancelDialogOpen(true);
        } else {
            // نقوم بتحديث الـ selectedOrderId هنا أيضاً لضمان عمل الـ Loading الافتراضي في الـ Select
            setSelectedOrderId(orderId);
            updateStatusMutation.mutate({ orderId, status: newStatus });
        }
    };

    const handleConfirmCancel = () => {
        if (!cancelReason.trim()) {
            toast.error(t("pleaseProvideCancellationReason"));
            return;
        }
        updateStatusMutation.mutate({
            orderId: selectedOrderId,
            status: 'cancelled',
            reason: cancelReason
        });
    };

    const columns = [
        {
            accessorKey: "orderNumber",
            header: t("orderNumber"),
            cell: ({ row }) => (
                <span className="font-medium text-gray-700">
                    {row.getValue("orderNumber")}
                </span>
            )
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
            )
        },
        {
            accessorKey: "orderType",
            header: t("orderType"),
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    row.original.orderType === 'delivery' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                    {t(row.original.orderType)}
                </span>
            )
        },
        {
            accessorKey: "totalAmount",
            header: t("totalAmount"),
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">
                    {row.getValue("totalAmount")} {t("currency")}
                </span>
            )
        },
        {
            accessorKey: "status",
            header: t("status"),
            cell: ({ row }) => (
                <Select
                    defaultValue={row.original.status}
                    onValueChange={(value) => handleStatusChange(row.original.id, value)}
                    // الـ Loader سيتفعل فقط للسطر الذي يتم تعديله حالياً
                    disabled={updateStatusMutation.isPending && selectedOrderId === row.original.id}
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
            )
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
            }
        },
        {
            id: "actions",
            header: t("actions"),
            cell: ({ row }) => {
                const orderId = row.original.id;
                return (
                    <div className="flex items-center justify-center">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-primary/10 text-primary"
                            onClick={() => navigate(`/orders/details/${orderId}`)}
                            title={t("viewDetails")}
                        >
                            <Eye size={18} />
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("ordersManagement")}
                columns={columns}
                data={orders}
                isLoading={isLoading}
                queryKey="orders"
                onEdit={false}
                actions={false}
                // لم نقم بتمرير editApiUrl هنا، فبالتالي سيعرض الـ Select الممرر في الـ columns بكل سلام!
            />

            {/* Dialog إلغاء الطلب */}
            <Dialog open={cancelDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setCancelDialogOpen(false);
                    setCancelReason("");
                    setSelectedOrderId(null);
                }
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t("cancelOrder")}</DialogTitle>
                        <DialogDescription>
                            {t("cancelOrderDescription")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder={t("enterCancellationReason")}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCancelDialogOpen(false)}
                            disabled={updateStatusMutation.isPending}
                        >
                            {t("back")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancel}
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" /> {t("processing")}</>
                            ) : (
                                t("confirmCancellation")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}