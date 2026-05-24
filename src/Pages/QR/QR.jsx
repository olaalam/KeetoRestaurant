import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function QR() {
    const navigate = useNavigate();

    const { data: qr = [], isLoading } = useQuery({
        queryKey: ['qr'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restQR');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });

    const columns = [
        {
            accessorKey: "qrCodeImg", // التأكد من مطابقة الاسم الراجع من الـ API (حرف I كبير)
            header: "qrCodeImg",
            cell: ({ row }) => {
                const imageStr = row.getValue("qrCodeImg");
                return (
                    <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
                        {imageStr ? (
                            <img
                                src={imageStr}
                                alt="category"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                );
            },
        },
        // {
        //     accessorKey: "restaurantid",
        //     header: "ID",
        // },

    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="qr"
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