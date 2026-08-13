import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';

const PaymentMethodAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();
    const { t } = useTranslation();

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: paymentMethodData, isLoading: isFetching } = useQuery({
        queryKey: ['paymentMethod', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/payment-methods/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.paymentMethodData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const initialData = state?.paymentMethodData || paymentMethodData;

    const paymentMethodFields = [
        { name: 'name', label: t('name'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        { name: 'Image', label: t('image'), type: 'file', required: true },
        { name: 'description', label: t('description'), required: true },
        { name: 'descriptionAr', label: t('descriptionAr'), required: true },
        { name: 'descriptionFr', label: t('descriptionFr'), required: true },
        { name: 'type', label: t('type'), required: true, type: 'select', options: [{ value: 'manual', label: t('manual') }, { value: 'automatic', label: t('automatic') }] },

    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="paymentMethod"
            apiUrl="/api/restaurant/payment-methods" // هذا هو الـ Base URL
            queryKey="paymentMethods"
            fields={paymentMethodFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default PaymentMethodAdd;