import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const CouponAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

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
        { name: 'code', label: 'code', required: true },
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        { name: 'maxDiscount', label: 'maxDiscount', type: 'number', required: true },
        { name: 'discountValue', label: 'discountValue', type: 'number', required: true },
        { name: 'minOrderAmount', label: 'minOrderAmount', type: 'number', required: true },
        { name: 'usageLimit', label: 'usageLimit', type: 'number', required: true },
        { name: 'startDate', label: 'startDate', type: 'date', required: true },
        { name: 'endDate', label: 'endDate', type: 'date', required: true },
        { name: 'discountType', label: 'discountType', required: true, type: 'select', options: [{ value: 'percentage', label: 'percentage' }, { value: 'fixed_amount', label: 'fixed_amount' }] },

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