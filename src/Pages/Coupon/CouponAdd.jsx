import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';

const CouponAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();
    const { t } = useTranslation();

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: CouponData, isLoading: isFetching } = useQuery({
        queryKey: ['Coupon', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/coupons/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.CouponData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const initialData = state?.CouponData || CouponData;

    const CouponFields = [
        { name: 'code', label: t('code'), required: true },
        { name: 'name', label: t('name'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        { name: 'maxDiscount', label: t('maxDiscount') || 'Max Discount', type: 'number', required: false },
        { name: 'discountValue', label: t('discountValue'), type: 'number', required: true },
        { name: 'minOrderAmount', label: t('minOrderAmount') || 'Min Order Amount', type: 'number', required: false },
        { name: 'usageLimit', label: t('usageLimit') || 'Usage Limit', type: 'number', required: false },
        { name: 'startDate', label: t('startDate'), type: 'date', required: true },
        { name: 'endDate', label: t('endDate'), type: 'date', required: true },
        { name: 'discountType', label: t('discountType'), required: true, type: 'select', options: [{ value: 'percentage', label: t('percentage') }, { value: 'fixed_amount', label: t('fixedAmount') }] },

    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="Coupon"
            apiUrl="/api/restaurant/Coupons" // هذا هو الـ Base URL
            queryKey="Coupons"
            fields={CouponFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default CouponAdd;