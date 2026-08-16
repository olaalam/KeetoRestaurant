import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";

export default function SubCategory() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: subcategories = [], isLoading } = useQuery({
        queryKey: ['subcategories'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/subcategories');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('name') },
        { accessorKey: 'nameAr', header: t('nameAr') },
        { accessorKey: 'nameFr', header: t('nameFr') },
        { accessorKey: 'category.name', header: t('categoryColumn') },
        { accessorKey: 'priority', header: t('priority') },
        {
            accessorKey: 'addons',
            header: t('addonsColumn'),
            cell: ({ row }) => {
                const addons = row.original.addons || [];
                if (addons.length === 0) {
                    return <span className="text-gray-400 text-sm">-</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {addons.map((addon) => (
                            <Badge key={addon.id} variant="outline" className="text-xs">
                                {addon.name}
                            </Badge>
                        ))}
                    </div>
                );
            }
        },
        { accessorKey: 'order_level', header: t('orderLevelColumn') },
        { accessorKey: 'status', header: t('status') }, // 💡 إضافة عمود الحالة هنا
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('subcategoriesTitle')}
                columns={columns}
                data={subcategories}
                isLoading={isLoading}
                queryKey="subcategories"
                deleteApiUrl="/api/restaurant/subcategories"
                editApiUrl="/api/restaurant/subcategories" // 💡 مطلوب لتفعيل السويتش التلقائي لتحديث الحالة
                onAdd={() => navigate("/sub-categories/add")}
                onEdit={(city) => navigate(`/sub-categories/edit/${city.id}`)}
            />
        </div>
    );
}