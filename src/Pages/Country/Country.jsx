import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export default function Country() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: countries = [], isLoading } = useQuery({
        queryKey: ['countries'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/countries');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('categoryNameHeader') },
        { accessorKey: 'nameAr', header: t('categoryNameArHeader') },
        { accessorKey: 'nameFr', header: t('categoryNameFrHeader') },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('countriesTitle')}
                columns={columns}
                data={countries}
                isLoading={isLoading}
                queryKey="countries"
                deleteApiUrl="/api/restaurant/countries"
                onAdd={() => navigate("/countries/add")}
                onEdit={(country) => navigate(`/countries/edit/${country.id}`)}
            />
        </div>
    );
}