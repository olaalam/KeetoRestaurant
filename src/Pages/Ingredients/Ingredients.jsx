import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Switch } from "@/components/ui/switch"; 
import { toast } from "sonner"; 
import { Eye } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد الهوك

export default function Ingredients() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useTranslation(); // تفعيل الهوك

    // 1. جلب البيانات
    const { data: ingredients = [], isLoading } = useQuery({
        queryKey: ['ingredients'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/ingredients');
            return res.data.data.data;
        }
    });

    // 2. الـ Mutation لتحديث حالة المخزون
    const updateStockMutation = useMutation({
        mutationFn: async ({ id, inStockValue }) => {
            return await api.put(`/api/restaurant/ingredients/stock/${id}`, {
                inStock: inStockValue
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ingredients']);
            toast.success(t("statusUpdatedSuccessfully"));
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || t("failedToUpdateStatus"));
        }
    });

    const handleStockToggle = (id, currentStatus) => {
        updateStockMutation.mutate({
            id: id,
            inStockValue: !currentStatus
        });
    };

    // 3. تعريف الأعمدة مترجمة
    const columns = [
        { accessorKey: 'name', header: t('nameEn') },
        { accessorKey: 'nameAr', header: t('nameAr') },
        { accessorKey: 'categoryName', header: t('category') },
        {
            accessorKey: 'inStock',
            header: t('inStock'),
            cell: ({ row }) => {
                const isPending = updateStockMutation.isPending && updateStockMutation.variables?.id === row.original.id;

                return (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Switch
                            checked={row.original.inStock}
                            onCheckedChange={() => handleStockToggle(row.original.id, row.original.inStock)}
                            disabled={isPending}
                        />
                        <span className="text-xs text-muted-foreground">
                            {row.original.inStock ? t("inStock") : t("outOfStock")}
                        </span>
                    </div>
                );
            }
        },
        {
            accessorKey: "view_foods",
            header: t('foods'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`/ingredients/food/${row.original.id}`)}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors text-xs font-semibold"
                >
                    <Eye size={14} />
                    {t('manageFoods')}
                </button>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("ingredients")}
                columns={columns}
                data={ingredients}
                isLoading={isLoading}
                queryKey="ingredients"
                deleteApiUrl="/api/restaurant/ingredients"
                onAdd={() => navigate("/ingredients/add")}
                onEdit={(item) => navigate(`/ingredients/edit/${item.id}`)}
            />
        </div>
    );
}