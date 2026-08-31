import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export default function Zone() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: zones = [], isLoading } = useQuery({
        queryKey: ['zones'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/zones');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('categoryNameHeader') },
        { accessorKey: 'nameAr', header: t('categoryNameArHeader') },
        { accessorKey: 'nameFr', header: t('categoryNameFrHeader') },
        { accessorKey: 'city.name', header: t('cityHeader') },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('zonesTitle')}
                columns={columns}
                data={zones}
                isLoading={isLoading}
                queryKey="zones"
                deleteApiUrl="/api/restaurant/zones"
                onAdd={() => navigate("/zones/add")}
                onEdit={(zone) => navigate(`/zones/edit/${zone.id}`)}
            />
        </div>
    );
}