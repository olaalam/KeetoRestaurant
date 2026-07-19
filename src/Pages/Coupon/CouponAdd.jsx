import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';

const CouponAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const { t } = useTranslation();

    const { data: CouponData, isLoading: isFetching } = useQuery({
        queryKey: ['Coupon', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/coupons/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.CouponData,
    });

    const initialData = state?.CouponData || CouponData;

    // حالة لتتبع نوع الخصم الحالي
    const [discountType, setDiscountType] = useState('percentage');

    // تعيين القيمة عند جلب بيانات التعديل
    useEffect(() => {
        if (initialData?.discountType) {
            setDiscountType(initialData.discountType);
        }
    }, [initialData]);

    const CouponFields = [
        { name: 'code', label: t('code'), required: true },
        { name: 'name', label: t('name'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        {
            name: 'discountType',
            label: t('discountType'),
            required: true,
            type: 'select',
            options: [
                { value: 'percentage', label: t('percentage') },
                { value: 'fixed_amount', label: t('fixedAmount') }
            ],
            onChange: (e) => {
                const value = e?.target ? e.target.value : e;
                setDiscountType(value);
            }
        },
        { name: 'discountValue', label: t('discountValue'), type: 'number', required: true },
        { name: 'maxDiscount', label: t('maxDiscount') || 'Max Discount', type: 'number', required: false },
        { name: 'minOrderAmount', label: t('minOrderAmount') || 'Min Order Amount', type: 'number', required: false },
        { name: 'usageLimit', label: t('usageLimit') || 'Usage Limit', type: 'number', required: false },

        // إظهار حقل perUserLimit فقط إذا كان نوع الخصم fixed_amount
        ...(discountType === 'fixed_amount' ? [
            {
                name: 'perUserLimit',
                label: t('perUserLimit') || 'Per User Limit',
                type: 'number',
                required: false,
                defaultValue: 5
            }
        ] : []),

        { name: 'startDate', label: t('startDate'), type: 'date', required: true },
        { name: 'endDate', label: t('endDate'), type: 'date', required: true },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="Coupon"
            apiUrl="/api/restaurant/Coupons"
            queryKey="Coupons"
            fields={CouponFields}
            initialData={initialData}
            transformData={(data) => {
                // إذا كان fixed_amount نرسل الحقل، وإذا لم يكن نقوم بحذفه من البيانات المرسلة
                if (data.discountType === 'fixed_amount') {
                    return { ...data, perUserLimit: data.perUserLimit || 5 };
                }
                const { perUserLimit, ...rest } = data;
                return rest;
            }}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default CouponAdd;