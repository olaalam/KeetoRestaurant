import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import FoodListDialog from '../Branches/FoodListDialog';
import { useTranslation } from '@/hooks/useTranslation';

export default function Discount() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFoodIds, setSelectedFoodIds] = useState([]); 

    // جلب البيانات
    const { data: discounts = [], isLoading } = useQuery({
        queryKey: ['discounts'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/discounts');
            return res.data?.data?.data || []; 
        }
    });

    const openFoodDialog = (foodIds) => {
        setSelectedFoodIds(foodIds || []);
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
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'nameAr', header: 'Name (Ar)' },
        { accessorKey: 'nameFr', header: 'Name (Fr)' },
        {
            accessorKey: 'foodIds', 
            header: 'Foods', 
            cell: ({ row }) => (
                <button
                    onClick={() => openFoodDialog(row.original.foodIds)} 
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
                >
                    <Eye size={16} />
                    {t('viewFood')}
                </button>
            )
        },
        { accessorKey: 'discountType', header: 'Type' },
        { accessorKey: 'discountValue', header: 'Value' },
        { accessorKey: 'maxDiscount', header: 'Max Discount' },
        { accessorKey: 'minOrderAmount', header: 'Min Order' },
        { accessorKey: 'usageLimit', header: 'Limit' },
        { accessorKey: 'startDate', header: 'Start Date', cell: (info) => formatDate(info.getValue()) },
        { accessorKey: 'endDate', header: 'End Date', cell: (info) => formatDate(info.getValue()) },
        { 
            accessorKey: 'status', 
            header: 'Status',
            cell: ({ row }) => row.original.isActive // ربط السويتش بحالة الـ isActive القادمة من الـ API
        }
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Discounts"
                columns={columns}
                data={discounts}
                isLoading={isLoading}
                queryKey="discounts"
                deleteApiUrl="/api/restaurant/discounts"
                // 💡 نمرر الـ Base URL والجدول سيقوم بتركيب الخاتمة /toggle-status بالداخل ذكياً
                editApiUrl="/api/restaurant/discounts" 
                onAdd={() => navigate("/discount/add")}
                onEdit={(discount) => navigate(`/discount/edit/${discount.id}`, { state: { DiscountData: discount } })}
            />
            
            {isDialogOpen && (
                <FoodListDialog
                    foodIds={selectedFoodIds} 
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setSelectedFoodIds([]); 
                    }}
                />
            )}
        </div>
    );
}