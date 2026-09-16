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
    const [selectedFoods, setSelectedFoods] = useState([]); 

    const { data: discounts = [], isLoading } = useQuery({
        queryKey: ['discounts'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/discounts');
            const result = res.data?.data?.data ?? res.data?.data ?? [];
            return Array.isArray(result) ? result : [];
        }
    });

    const openFoodDialog = (foods) => {
        setSelectedFoods(foods || []);
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
        {
            accessorKey: 'logo',
            header: 'Logo',
            cell: ({ row }) => (
                <img src={row.original.logo} alt={row.original.name} className="w-10 h-10 object-cover rounded-md" />
            )
        },
        { accessorKey: 'nameAr', header: 'Name (Ar)' },
        { accessorKey: 'nameFr', header: 'Name (Fr)' },
        {
            accessorKey: 'foods', 
            header: 'Foods', 
            cell: ({ row }) => (
                <button
                    onClick={() => openFoodDialog(row.original.foods)} 
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
        { accessorKey: 'endDate', header: 'End Date', cell: (info) => formatDate(info.getValue()) },
        { 
            accessorKey: 'isActive', 
            header: 'Status',
        }
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Offers"
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