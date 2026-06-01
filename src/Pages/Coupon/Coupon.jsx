import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function Coupon() {
    const navigate = useNavigate();

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/coupons');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
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
        { accessorKey: 'code', header: 'code' },
        { accessorKey: 'name', header: 'name' },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },
        { accessorKey: 'discountType', header: 'discountType' },
        { accessorKey: 'discountValue', header: 'discountValue' },
        { accessorKey: 'maxDiscount', header: 'maxDiscount' },
        { accessorKey: 'minOrderAmount', header: 'minOrderAmount' },
        { accessorKey: 'usageLimit', header: 'usageLimit' },
        { accessorKey: 'startDate', header: 'startDate',cell: (info) => formatDate(info.getValue()) },
        { accessorKey: 'endDate', header: 'endDate' , cell: (info) => formatDate(info.getValue())},

    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="coupons"
                columns={columns}
                data={coupons}
                isLoading={isLoading}
                queryKey="coupons"
                deleteApiUrl="/api/restaurant/coupons"
                onAdd={() => navigate("/coupon/add")}
                onEdit={(coupon) => navigate(`/coupon/edit/${coupon.id}`)}
            />
        </div>
    );
}