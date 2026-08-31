import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export default function City() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: cities = [], isLoading } = useQuery({
        queryKey: ['cities'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/cities');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('categoryNameHeader') },
        { accessorKey: 'nameAr', header: t('categoryNameArHeader') },
        { accessorKey: 'nameFr', header: t('categoryNameFrHeader') },
        { accessorKey: 'country.name', header: t('countryHeader') },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('citiesTitle')}
                columns={columns}
                data={cities}
                isLoading={isLoading}
                queryKey="cities"
                deleteApiUrl="/api/restaurant/cities"
                onAdd={() => navigate("/cities/add")}
                onEdit={(city) => navigate(`/cities/edit/${city.id}`)}
            />
        </div>
    );
}