import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Slider() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: slider = [], isLoading } = useQuery({
        queryKey: ['slider'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/slider');
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
                title={t("restaurantSlider")}
                columns={columns}
                data={slider}
                isLoading={isLoading}
                queryKey="slider"
                editApiUrl="/api/restaurant/slider"
                deleteApiUrl="/api/restaurant/slider"
                onAdd={() => navigate("/slider/add")}
                onEdit={(slider) => navigate(`/slider/edit/${slider.id}`)}
            />
        </div>
    );
}