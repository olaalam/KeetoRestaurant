import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Addons() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: addons = [], isLoading } = useQuery({
        queryKey: ['addons'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/addons');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('addonName') },
        { accessorKey: 'nameAr', header: t('addonNameAr') },
        { accessorKey: 'nameFr', header: t('addonNameFr') },
        { 
            accessorKey: 'price', 
            header: t('price'),
            cell: ({ row }) => `${row.getValue('price')} ${t('currency')}`
        },
        { 
            accessorKey: 'stock_type', 
            header: t('stockType'),
            cell: ({ row }) => t(row.getValue('stock_type')) // ترجمة نوع المخزون ديناميكياً
        },
        {
            accessorKey: 'adonescategory.name',
            header: t('category'),
            cell: ({ row }) => row.original.adonescategory?.name || t('na')
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('modifier')}
                columns={columns}
                data={addons}
                isLoading={isLoading}
                queryKey="addons"
                deleteApiUrl="/api/restaurant/addons"
                onAdd={() => navigate("/addons/add")}
                onEdit={(addon) => navigate(`/addons/edit/${addon.id}`)}
            />
        </div>
    );
}