import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Policy() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: policy = [], isLoading } = useQuery({
        queryKey: ['policy'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/policy');
            return res.data.data.data;
        }
    });

    const columns = [
        {
            accessorKey: "title",
            header: t("Title"),
        },

        {
            accessorKey: "description",
            header: t("description"),
        },

    ];
    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("policy")}
                columns={columns}
                data={policy}
                isLoading={isLoading}
                queryKey="policy"
                deleteApiUrl="/api/restaurant/policy"
                onAdd={() => navigate("/policy/add")}
                onEdit={(policy) => navigate(`/policy/edit/${policy.id}`)}
            />
        </div>
    );
}