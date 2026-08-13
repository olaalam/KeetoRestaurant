import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; 

const DiscountAdd = () => {
    const { t } = useTranslation(); // 2. تفعيل دالة الترجمة
    const { id } = useParams(); 
    const { state } = useLocation();

    // جلب بيانات القوائم المنسدلة (الأطعمة والفروع)
    const { data: selectData, isLoading: isSelectDataLoading } = useQuery({
        queryKey: ['branchemenu-select-data'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/branchemenu/select-data');
            return res.data?.data?.data || { branches: [], foods: [] };
        }
    });

    // جلب بيانات الخصم في حالة التعديل (إذا لم تكن متوفرة في الـ state)
    const { data: DiscountData, isLoading: isFetching } = useQuery({
        queryKey: ['Discount', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/discounts/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.DiscountData, 
    });

    // 3. تحديد البيانات الأولية (إما القادمة من الصفحة السابقة أو من الـ API)
    const initialData = state?.DiscountData || DiscountData;

    const DiscountFields = [
        { name: 'name', label: t('name'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        { name: 'logo', label: t('logo'), type: 'file', required: false },
        {
            name: 'foodIds',
            label: t('food'), // الآن ستعمل بدون مشاكل
            required: false,
            type: 'multi-select',
            options: (selectData?.foods || []).map(f => ({
                value: String(f.id),
                label: f.name
            }))
        },
        { name: 'maxDiscount', label: t('maxDiscount'), type: 'number', required: false },
        { name: 'discountValue', label: t('discountValue'), type: 'number', required: true },
        { name: 'minOrderAmount', label: t('minOrderAmount'), type: 'number', required: false },
        { name: 'usageLimit', label: t('usageLimit'), type: 'number', required: false },
        { name: 'startDate', label: t('startDate'), type: 'date', required: true },
        { name: 'endDate', label: t('endDate'), type: 'date', required: true },
        { 
            name: 'discountType', 
            label: t('discountType'), 
            required: true, 
            type: 'select', 
            options: [
                { value: 'percentage', label: t('percentage') }, 
                { value: 'fixed_amount', label: t('fixedAmount') }
            ] 
        },
    ];

    // 4. الانتظار حتى ينتهي تحميل بيانات الخصم أو بيانات الأطعمة لضمان عدم ظهور حقول فارغة
    if ((id && isFetching) || isSelectDataLoading) {
        return <LoadingSpinner />;
    }

    return (
        <AddPage
            title={id ? "Edit Discount" : "Add Discount"} // تحسين بسيط للعنوان ليناسب التعديل أو الإضافة
            apiUrl="/api/restaurant/discounts" 
            queryKey="Discounts"
            fields={DiscountFields}
            initialData={initialData} 
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default DiscountAdd;