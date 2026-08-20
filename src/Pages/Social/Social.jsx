import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";

export default function Social() {
    const navigate = useNavigate();
    const { t, language } = useTranslation();

    const { data: social = [], isLoading } = useQuery({
        queryKey: ['social'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/socialmedia/');
            return res.data?.data?.data || res.data?.data || [];
        }
    });

    const columns = [
        {
            id: "platform",
            header: t("platform") || "Platform",
            cell: ({ row }) => {
                const icon = row.original.platform?.icon || row.original.icon;
                const platformName = language === 'ar'
                    ? (row.original.platform?.nameAr || row.original.platform?.name || row.original.name)
                    : (row.original.platform?.name || row.original.platform?.nameAr || row.original.name);

                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border rounded-md overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            {icon ? (
                                <img
                                    src={icon}
                                    alt="Platform Icon"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-[10px] text-gray-400">
                                    {t("noImage")}
                                </div>
                            )}
                        </div>
                        {platformName && (
                            <span className="font-medium text-gray-800 text-sm">
                                {platformName}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "link",
            header: t("link"),
            cell: ({ row }) => (
                <a
                    href={row.original.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm dir-ltr inline-block"
                >
                    {row.original.link}
                </a>
            ),
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
                onEdit={(socialItem) => navigate(`/social/edit/${socialItem.id}`)}
            />
        </div>
    );
}