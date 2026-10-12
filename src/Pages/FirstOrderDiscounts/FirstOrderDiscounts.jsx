import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Switch } from "@/components/ui/switch";

export default function FirstOrderDiscounts() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const queryKey = ['first-order-discounts'];

    const apiUrl = "/api/restaurant/first-order-discounts";

    // جلب البيانات للجدول
    const { data: discounts = [], isLoading } = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const res = await api.get(apiUrl);
            return res.data?.data?.data || res.data?.data || res.data;
        }
    });

    // دالة لتغيير الحالة (Toggle Status) مباشرة من الجدول
    const toggleMutation = useMutation({
        mutationFn: async (id) => {
            return await api.put(`${apiUrl}/${id}/toggle-status`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('name') || 'الاسم' },
        { accessorKey: 'nameAr', header: t('nameAr') || 'الاسم بالعربية' },
        { accessorKey: 'firstOrderCount', header: t('firstOrderCount') || 'عدد الطلبات الأولى' },
        { accessorKey: 'discountValue', header: t('discountValue') || 'قيمة الخصم' },
        { accessorKey: 'maxUsage', header: t('maxUsage') || 'الحد الأقصى للاستخدام' },
        {
            accessorKey: 'startDate',
            header: t('startDate'),
            cell: ({ row }) => row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : '-'
        },
        {
            accessorKey: 'endDate',
            header: t('endDate'),
            cell: ({ row }) => row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : '-'
        },
        {
            accessorKey: 'status',
            header: t('statusHeader') || 'الحالة',
            cell: ({ row }) => {
                const isActive = row.original.status === 'active';
                return (
                    <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleMutation.mutate(row.original.id)}
                        disabled={toggleMutation.isPending}
                    />
                );
            }
        },
    ];

    return (
        <div className="container mx-auto py-2">
            <GenericDataTable
                title={t('firstOrderDiscountsTitle') || 'خصومات الطلب الأول'}
                columns={columns}
                data={discounts}
                isLoading={isLoading}
                queryKey={queryKey}
                deleteApiUrl={apiUrl}
                onAdd={() => navigate("/first-order-discounts/add")}
                onEdit={(item) => navigate(`/first-order-discounts/edit/${item.id}`, { state: { editData: item } })}
            />
        </div>
    );
}