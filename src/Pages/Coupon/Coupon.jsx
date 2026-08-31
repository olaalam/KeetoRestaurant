import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export default function Coupon() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/coupons');
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
        { accessorKey: 'code', header: t('codeHeader') },
        { accessorKey: 'name', header: t('categoryNameHeader') },
        { accessorKey: 'nameAr', header: t('categoryNameArHeader') },
        { accessorKey: 'nameFr', header: t('categoryNameFrHeader') },
        { accessorKey: 'discountType', header: t('discountTypeHeader') },
        { accessorKey: 'discountValue', header: t('discountValueHeader') },
        { accessorKey: 'maxDiscount', header: t('maxDiscountHeader') },
        { accessorKey: 'minOrderAmount', header: t('minOrderAmountHeader') },
        { accessorKey: 'usageLimit', header: t('usageLimitHeader') },
        { accessorKey: 'startDate', header: t('startDateHeader'), cell: (info) => formatDate(info.getValue()) },
        { accessorKey: 'endDate', header: t('endDateHeader'), cell: (info) => formatDate(info.getValue()) },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('couponsTitle')}
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