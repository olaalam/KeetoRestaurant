import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useParams } from 'react-router-dom';
import { Switch } from "@/components/ui/switch"; 
import { useTranslation } from "@/hooks/useTranslation"; 
import { toast } from "sonner"; 

export default function BrancheMenu() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { restaurantId } = useParams(); // استقبال المعرف من الرابط الأساسي
    const { t } = useTranslation(); 

    // 1. جلب البيانات بناءً على معرف المطعم/الفرع
    const { data: branchemenu = [], isLoading } = useQuery({
        queryKey: ['branchemenu', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/branchemenu/${restaurantId}`);
            return res.data?.data?.data || res.data?.data || [];
        }
    });

    // 2. دالة تحديث الحالة (Mutation)
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id }) => {
            return await api.patch(`/api/restaurant/branchemenu/${id}/status`);
        },
        onSuccess: () => {
            toast.success(t("statusUpdatedSuccessfully"));
            queryClient.invalidateQueries({ queryKey: ['branchemenu'] });
        },
        onError: () => {
            toast.error(t("failedToUpdateStatus"));
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('food') },
        { 
            accessorKey: 'price', 
            header: t('price'),
            cell: ({ getValue }) => `${getValue() || 0} ${t('egp')}`
        },
        { 
            accessorKey: 'stockType', 
            header: t('stockType'),
            cell: ({ getValue }) => getValue() ? t(getValue().toLowerCase()) : '—'
        },
        { accessorKey: 'stockQty', header: t('stockQty') },
        {
            accessorKey: 'status',
            header: t('status'),
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Switch
                        checked={row.original.status === 'active' || row.original.status === true}
                        onCheckedChange={() =>
                            updateStatusMutation.mutate({
                                id: row.original.menuItemId, 
                                currentStatus: row.original.status
                            })
                        }
                        disabled={updateStatusMutation.isPending}
                    />
                </div>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("branchMenu")}
                columns={columns}
                data={branchemenu}
                isLoading={isLoading}
                queryKey="branchemenu"
                deleteApiUrl="/api/restaurant/branchemenu"
                // 🌟 الحل السحري: تمرير الـ branchId هنا أيضاً عند الإضافة لتستقبله صفحة BrancheMenuAdd
                onAdd={() => navigate(`/branches/branch_menu/add`, { state: { branchId: restaurantId } })}
                onEdit={(row) => navigate(`/branches/branch_menu/edit/${row.menuItemId}`, { state: { branchId: restaurantId } })}
            />
        </div>
    );
}