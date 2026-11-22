import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import FoodListDialog from './FoodListDialog';
import { useTranslation } from "@/hooks/useTranslation";
import { Switch } from "@/components/ui/switch";

export default function Restaurant() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const queryKey = ['branches'];

    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [globalVisaStatus, setGlobalVisaStatus] = useState(false);

    const openFoodDialog = (restaurantId) => {
        setSelectedRestaurant(restaurantId);
        setIsDialogOpen(true);
    };

    const { data: branches = [], isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await api.get('/api/restaurant/branches');
            const list = res.data?.data?.data || res.data?.data || res.data || [];
            if (Array.isArray(list) && list.length > 0) {
                setGlobalVisaStatus(list.every((branch) => Boolean(branch.visa_status)));
            }
            return list;
        }
    });

    // Switch لكل فرع: PUT /api/restaurant/branches/{id}/visa-status
    const branchVisaMutation = useMutation({
        mutationFn: async ({ id, visa_status }) => {
            return await api.put(`/api/restaurant/branches/${id}/visa-status`, {
                visa_status,
            });
        },
        onSuccess: (_, { id, visa_status }) => {
            queryClient.setQueryData(queryKey, (oldData = []) => {
                if (!Array.isArray(oldData)) return oldData;
                const updated = oldData.map((branch) =>
                    branch.id === id ? { ...branch, visa_status } : branch
                );
                setGlobalVisaStatus(updated.length > 0 && updated.every((b) => Boolean(b.visa_status)));
                return updated;
            });
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Switch عام لكل الفروع: PUT /api/restaurant/branches/visa-status
    const allBranchesVisaMutation = useMutation({
        mutationFn: async (visa_status) => {
            return await api.put('/api/restaurant/branches/visa-status', {
                visa_status,
            });
        },
        onSuccess: (_, visa_status) => {
            setGlobalVisaStatus(visa_status);
            queryClient.setQueryData(queryKey, (oldData = []) => {
                if (!Array.isArray(oldData)) return oldData;
                return oldData.map((branch) => ({ ...branch, visa_status }));
            });
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const columns = [
        {
            accessorKey: "name",
            header: t('branchName'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`/branches/setting/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {row.getValue("name")}
                </button>
            )
        },
        { accessorKey: 'nameAr', header: t('nameAr') },
        { accessorKey: 'nameFr', header: t('nameFr') },
        { accessorKey: "zone.name", header: t('zoneColumn') },
        {
            accessorKey: "visa_status",
            header: () => (
                <div
                    className="flex items-center justify-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span>{t('visa') || 'visa'}</span>
                    <Switch
                        checked={globalVisaStatus}
                        disabled={allBranchesVisaMutation.isPending || branchVisaMutation.isPending}
                        onCheckedChange={(checked) => allBranchesVisaMutation.mutate(checked)}
                    />
                </div>
            ),
            cell: ({ row }) => {
                const branch = row.original;
                const isVisaEnabled = Boolean(branch.visa_status);
                const isRowMutating =
                    branchVisaMutation.isPending &&
                    branchVisaMutation.variables?.id === branch.id;

                return (
                    <Switch
                        checked={isVisaEnabled}
                        disabled={isRowMutating || allBranchesVisaMutation.isPending}
                        onCheckedChange={(checked) =>
                            branchVisaMutation.mutate({
                                id: branch.id,
                                visa_status: checked,
                            })
                        }
                    />
                );
            }
        },
        {
            accessorKey: "view_food",
            header: t('foodMenuColumn'),
            cell: ({ row }) => (
                <button
                    onClick={() => openFoodDialog(row.original.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
                >
                    <Eye size={16} />
                    {t('viewFood')}
                </button>
            )
        },
        {
            accessorKey: "branch_menu",
            header: t('branchMenuColumn'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`branch_menu/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {t('branchMenuColumn')}
                </button>
            )
        },
        {
            accessorKey: "transaction",
            header: t('transactionColumn'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`transaction/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {t('transactionColumn')}
                </button>
            )
        },
        {
            accessorKey: "wallet",
            header: t('walletColumn'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`wallet/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {t('walletColumn')}
                </button>
            )
        },
        // تم حذف خاصية cell من هنا ليعمل الـ Switch التلقائي من GenericDataTable[cite: 3]
        {
            accessorKey: "status",
            header: t('status'),
        },
    ];

    return (
        <div className="container mx-auto py-2">
            <GenericDataTable
                title={t('branchesTitle')}
                columns={columns}
                data={branches}
                isLoading={isLoading}
                queryKey="branches"
                deleteApiUrl="/api/restaurant/branches"
                editApiUrl="/api/restaurant/branches"
                onAdd={() => navigate("/branches/add")}
                onEdit={(branch) => navigate(`/branches/edit/${branch.id}`)}
                // 👇 الخاصية الجديدة التي تفعل الـ Dialog في هذه الصفحة فقط[cite: 3]
                requireInactiveReason={true}
            />

            {isDialogOpen && (
                <FoodListDialog
                    restaurantId={selectedRestaurant}
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                />
            )}
        </div>
    );
}