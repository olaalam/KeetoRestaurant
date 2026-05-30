import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useParams } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد الهوك

export default function IngredientsFoods() {
    const { categoryId } = useParams();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: ingredientFoods = [], isLoading } = useQuery({
        queryKey: ['ingredient-food', categoryId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/ingredients/foods/${categoryId}`);
            return res.data.data.data; 
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('nameEn') },
        { accessorKey: 'nameAr', header: t('nameAr') },
        { accessorKey: 'nameFr', header: t('nameFr') },
        {
            accessorKey: 'status',
            header: t('status'),
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status === 'active' ? t('active') : t('inactive')}
                    </span>
                );
            }
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("foods")}
                columns={columns}
                data={ingredientFoods}
                isLoading={isLoading}
                queryKey="ingredient-food"
                actions={false}
            />
        </div>
    );
}