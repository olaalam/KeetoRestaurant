import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Social() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: social = [], isLoading } = useQuery({
        queryKey: ['social'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/socialmedia/');
            return res.data.data.data;
        }
    });

    const columns = [
        {
            accessorKey: "icon", 
            header: t("icon"),
            cell: ({ row }) => {
                const imageStr = row.getValue("icon");
                return (
                    <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
                        {imageStr ? (
                            <img
                                src={imageStr}
                                alt="Platform Icon"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                                {t("noImage")}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "link",
            header: t("link"),
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("socialMedia")}
                columns={columns}
                data={social}
                isLoading={isLoading}
                queryKey="social"
                deleteApiUrl="/api/restaurant/socialmedia/"
                onAdd={() => navigate("/social/add")}
                onEdit={(social) => navigate(`/social/edit/${social.id}`)}
            />
        </div>
    );
}