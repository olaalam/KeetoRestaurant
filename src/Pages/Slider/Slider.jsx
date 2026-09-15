import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";

export default function Slider() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: slider = [], isLoading } = useQuery({
        queryKey: ['slider'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/slider');
            return res.data?.data?.data || []; 
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
        {
            accessorKey: "linkType",
            header: t("linkType") || "Link Type",
            cell: ({ row }) => {
                const type = row.getValue("linkType");
                return (
                    <span className="capitalize font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md text-xs">
                        {type || "-"}
                    </span>
                );
            }
        },
        {
            id: "targetValue",
            header: t("target") || "Linked Item / Link",
            cell: ({ row }) => {
                const item = row.original;

                switch (item.linkType) {
                    case "link":
                        return item.link ? (
                            <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:underline text-sm truncate max-w-[200px] block"
                            >
                                {item.link}
                            </a>
                        ) : "-";

                    case "product":
                    case "food":
                        return item.foodNameAr || item.foodName || "-";

                    case "subcategory":
                        return item.subcategoryNameAr || item.subcategoryName || "-";

                    case "category":
                        return item.categoryNameAr || item.categoryName || "-";

                    case "discount":
                        return item.discountNameAr || item.discountName || "-";

                    default:
                        return "-";
                }
            }
        }
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