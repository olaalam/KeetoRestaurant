import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export default function AddonsCat() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['addonsCategories'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/adonescategory');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('addonCategoryNameHeader') },
        { accessorKey: 'nameAr', header: t('addonCategoryNameArHeader') },
        { accessorKey: 'nameFr', header: t('addonCategoryNameFrHeader') },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('addonCategoriesTitle')}
                columns={columns}
                data={categories}
                isLoading={isLoading}
                queryKey="addonsCategories"
                deleteApiUrl="/api/restaurant/adonescategory"
                onAdd={() => navigate("/addons-categories/add")}
                onEdit={(cat) => navigate(`/addons-categories/edit/${cat.id}`)}
            />
        </div>
    );
}
