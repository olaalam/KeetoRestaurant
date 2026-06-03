import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Image() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: image = [], isLoading } = useQuery({
        queryKey: ['image'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/image');
            return res.data.data.data; 
        }
    });

    const columns = [
        {
            accessorKey: "img", 
            header: t("image"),
            cell: ({ row }) => {
                const imageStr = row.getValue("img");
                return (
                    <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
                        {imageStr ? (
                            <img
                                src={imageStr}
                                alt="Restaurant Asset"
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
            accessorKey: "periorty",
            header: t("priority"),
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("restaurantImages")}
                columns={columns}
                data={image}
                isLoading={isLoading}
                queryKey="image"
                editApiUrl="/api/restaurant/image"
                deleteApiUrl="/api/restaurant/image"
                onAdd={() => navigate("/image/add")}
                onEdit={(image) => navigate(`/image/edit/${image.id}`)}
            />
        </div>
    );
}