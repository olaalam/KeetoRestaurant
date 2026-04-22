import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useParams } from 'react-router-dom';
import { Switch } from "@/components/ui/switch"; // تأكدي من مسار المكون في مشروعك

export default function BrancheMenu() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { restaurantId } = useParams();

    // 1. جلب البيانات
    const { data: branchemenu = [], isLoading } = useQuery({
        queryKey: ['branchemenu'],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/branchemenu/${restaurantId}`);
            return res.data?.data?.data || res.data?.data || [];
        }
    });

    // 2. دالة تحديث الحالة (Mutation)
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, currentStatus }) => {
            // استخدام الـ API الذي حددتِه (patch)
            return await api.patch(`/api/restaurant/basiccampaign/${id}/status`);
        },
        onSuccess: () => {
            toast.success("Status updated successfully");
            // إعادة جلب البيانات لتحديث الجدول
            queryClient.invalidateQueries(['business-plans']);
        },
        onError: () => {
            toast.error("Failed to update status");
        }
    });

    const columns = [
        // { accessorKey: 'branchId', header: 'Branch' },
        { accessorKey: 'name', header: 'Food' },
        { accessorKey: 'price', header: 'Price' },
        { accessorKey: 'stockType', header: 'Stock Type' },
        { accessorKey: 'stockQty', header: 'Stock Qty' },
        // عمود الحالة الجديد مع الـ Switch
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Switch
                        checked={row.original.status === 'active' || row.original.status === true}
                        onCheckedChange={() =>
                            updateStatusMutation.mutate({
                                id: row.original.id,
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
                title="branchemenu"
                columns={columns}
                data={branchemenu}
                isLoading={isLoading}
                queryKey="branchemenu"
                deleteApiUrl="/api/restaurant/branchemenu"
                onAdd={() => navigate(`/branches/branch_menu/add`)}
                onEdit={() => navigate(`/branches/branch_menu/edit/${restaurantId}`)}
            />
        </div>
    );
}