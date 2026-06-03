import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function QR() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: qr = [], isLoading } = useQuery({
        queryKey: ['qr'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restQR');
            return res.data.data.data;
        }
    });

    const columns = [
        {
            accessorKey: "qrCodeImg",
            header: t("qrCodeImage"), // ترجمة عنوان العمود
            cell: ({ row }) => {
                const imageStr = row.getValue("qrCodeImg");
                return (
                    <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
                        {imageStr ? (
                            <img
                                src={imageStr}
                                alt="QR Code"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                                {t("noImage")} {/* نص عند عدم وجود صورة */}
                            </div>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("qrCode")} // عنوان الجدول معرب ومترجم
                columns={columns}
                data={qr}
                isLoading={isLoading}
                queryKey="qr"
                deleteApiUrl="/api/restaurant/restQR"
                onAdd={() => navigate("/qr/add")}
            />
        </div>
    );
}