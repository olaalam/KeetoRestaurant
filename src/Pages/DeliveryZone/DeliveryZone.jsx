import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign } from "lucide-react";

export default function DeliveryZone() {
    const navigate = useNavigate();

    // 1. جلب بيانات مناطق التوصيل
    const { data: deliveryFees = [], isLoading } = useQuery({
        queryKey: ['DeliveryZone'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurant-zone-delivery-fees');
            // بناءً على الـ Response: res.data.data.data
            return res.data.data.data;
        }
    });

    // 2. تعريف الأعمدة لتطابق الهيكل الجديد
    const columns = [
        {
            accessorKey: 'zone.name', // الوصول للاسم داخل كائن zone
            header: 'Zone Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="font-medium">{row.original.zone?.name || 'N/A'}</span>
                </div>
            )
        },
        {
            accessorKey: 'deliveryFee',
            header: 'Delivery Fee',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 font-semibold text-green-600">
                    <span>{row.original.deliveryFee} EGP</span>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${row.original.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {row.original.status}
                </span>
            )
        },

    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Delivery Fees"
                columns={columns}
                data={deliveryFees}
                isLoading={isLoading}
                queryKey="DeliveryZone"
                deleteApiUrl="/api/restaurant/restaurant-zone-delivery-fees"
                onAdd={() => navigate("/delivery-zones/add")}
                onEdit={(item) => navigate(`/delivery-zones/edit/${item.id}`)}
            />
        </div>
    );
}