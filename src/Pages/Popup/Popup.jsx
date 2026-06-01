import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Popup() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: popup = [], isLoading } = useQuery({
        queryKey: ['popup'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/popups');
            return res.data.data.data;
        }
    });
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };
    const columns = [
        {
            accessorKey: "Title",
            header: t("Title"),
        },
        {
            accessorKey: "TitleAr",
            header: t("TitleAr"),
        },
        {
            accessorKey: "TitleFr",
            header: t("TitleFr"),
        },
        {
            accessorKey: "description",
            header: t("description"),
        },
        {
            accessorKey: "descriptionAr",
            header: t("descriptionAr"),
        },
        {
            accessorKey: "descriptionFr",
            header: t("descriptionFr"),
        },
        {
            accessorKey: "image",
            header: t("image"),
            cell: ({ row }) => {
                const imageStr = row.getValue("image");
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
            accessorKey: "imageAr",
            header: t("imageAr"),
            cell: ({ row }) => {
                const imageStr = row.getValue("imageAr");
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
            accessorKey: "imageFr",
            header: t("imageFr"),
            cell: ({ row }) => {
                const imageStr = row.getValue("imageFr");
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
            accessorKey: "type",
            header: t("type"),
        },
        {
            accessorKey: "status",
            header: t("status"),
        },
        {
            accessorKey: "startDate",
            header: t("startDate")
            , cell: (info) => formatDate(info.getValue())
        },
        {
            accessorKey: "endDate",
            header: t("endDate")
            , cell: (info) => formatDate(info.getValue())
        },
    ];
    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("popups")}
                columns={columns}
                data={popup}
                isLoading={isLoading}
                queryKey="popup"
                editApiUrl="/api/restaurant/popups"
                deleteApiUrl="/api/restaurant/popups"
                onAdd={() => navigate("/popup/add")}
                onEdit={(popup) => navigate(`/popup/edit/${popup.id}`)}
            />
        </div>
    );
}