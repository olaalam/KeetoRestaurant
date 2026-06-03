import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // 1. استيراد هوك الترجمة

export default function Admin() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // 2. تفعيل هوك الترجمة

    const { data: admins = [], isLoading } = useQuery({
        queryKey: ['admins'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurantadmin');
            return res.data.data.data;
        }
    });

    // 3. ترجمة رؤوس الأعمدة والقيم بداخلها
    const columns = [
        { accessorKey: 'name', header: t('name') },
        { accessorKey: 'nameAr', header: t('nameAr') },
        { accessorKey: 'nameFr', header: t('nameFr') },
        { accessorKey: 'email', header: t('email') },
        { accessorKey: 'phoneNumber', header: t('phoneNumber') },
        {
            accessorKey: 'status',
            header: t('status'),
            cell: ({ row }) => {
                const statusValue = row.original.status;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs ${statusValue === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {/* ترجمة حالة المسؤول تلقائياً إذا كانت active أو inactive */}
                        {t(statusValue)} 
                    </span>
                );
            }
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('admins')} // 4. ترجمة عنوان الجدول
                columns={columns}
                data={admins}
                isLoading={isLoading}
                queryKey="admins"
                deleteApiUrl="/api/restaurant/restaurantadmin"
                editApiUrl="/api/restaurant/restaurantadmin"
                onAdd={() => navigate("/admins/add")}
                onEdit={(admin) => navigate(`/admins/edit/${admin.id}`)}
            />
        </div>
    );
}