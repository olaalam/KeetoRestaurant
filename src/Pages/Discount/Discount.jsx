import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import FoodListDialog from '../Branches/FoodListDialog';
import { useTranslation } from '@/hooks/useTranslation';

export default function Discount() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFoods, setSelectedFoods] = useState([]); 

    const { data: discounts = [], isLoading } = useQuery({
        queryKey: ['discounts'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/discounts');
            const result = res.data?.data?.data ?? res.data?.data ?? [];
            return Array.isArray(result) ? result : [];
        }
    });

    // إضافة useMutation لتغيير حالة الخصم
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, newStatus }) => {
            return await api.put(`/api/restaurant/discounts/${id}`, {
                isActive: newStatus
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
        },
        onError: (error) => {
            console.error("Failed to update status:", error);
        }
    });

    // استخراج كافة الأصناف من داخل الـ groups وعرضها
    const openFoodDialog = (groups = [], directFoods = []) => {
        const foodsFromGroups = groups.flatMap((group) => group.foods || []);
        const foodsToShow = foodsFromGroups.length > 0 ? foodsFromGroups : directFoods;

        setSelectedFoods(foodsToShow);
        setIsDialogOpen(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const columns = [
        { accessorKey: 'name', header: t('Name') },
        {
            accessorKey: 'logo',
            header: t('Logo'),
            cell: ({ row }) => (
                row.original.logo ? (
                    <img src={row.original.logo} alt={row.original.name} className="w-10 h-10 object-cover rounded-md" />
                ) : '-'
            )
        },
        { accessorKey: 'nameAr', header: t('Name (Ar)') },
        { accessorKey: 'nameFr', header: t('Name (Fr)') },
        {
            accessorKey: 'foods', 
            header: t('Foods'), 
            cell: ({ row }) => {
                const groups = row.original.groups || [];
                const directFoods = row.original.foods || [];
                // حساب مجموع أصناف المأكولات الموجودة في كافة المجموعات
                const totalFoodsCount = groups.reduce((acc, g) => acc + (g.foods?.length || 0), 0) || directFoods.length;

                return (
                    <button
                        onClick={() => openFoodDialog(groups, directFoods)} 
                        className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors text-xs font-semibold"
                    >
                        <Eye size={16} />
                        {t('viewFood')} ({totalFoodsCount})
                    </button>
                );
            }
        },
        { accessorKey: 'minOrderAmount', header: t('Min Order') },
        { accessorKey: 'usageLimit', header: t('Limit') },
        { accessorKey: 'endDate', header: t('End Date'), cell: (info) => formatDate(info.getValue()) },
        { 
            accessorKey: 'isActive', 
            header: t('Status'),
            cell: ({ row }) => {
                const isChecked = row.original.isActive;
                const isPending = toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === row.original.id;

                return (
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isChecked}
                            disabled={isPending}
                            onChange={() => {
                                toggleStatusMutation.mutate({
                                    id: row.original.id,
                                    newStatus: !isChecked
                                });
                            }}
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                    </label>
                );
            }
        }
    ];

    return (
        <div className="container mx-auto py-2">
            <GenericDataTable
                title={t('Offers')}
                columns={columns}
                data={discounts}
                isLoading={isLoading}
                queryKey="discounts"
                deleteApiUrl="/api/restaurant/discounts"
                editApiUrl="/api/restaurant/discounts" 
                onAdd={() => navigate("/discount/add")}
                onEdit={(discount) => navigate(`/discount/edit/${discount.id}`, { state: { DiscountData: discount } })}
            />
            
            {isDialogOpen && (
                <FoodListDialog
                    foods={selectedFoods} 
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setSelectedFoods([]); 
                    }}
                />
            )}
        </div>
    );
}