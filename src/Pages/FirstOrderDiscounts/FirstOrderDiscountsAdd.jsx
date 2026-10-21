import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';

const FirstOrderDiscountAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const baseUrl = "/api/restaurant/first-order-discounts";

    // جلب بيانات العنصر في حال التعديل إذا لم تكن موجودة في الـ state
    const { data: fetchedData, isLoading: isFetching } = useQuery({
        queryKey: ['first-order-discount', id],
        queryFn: async () => {
            const { data } = await api.get(`${baseUrl}/${id}`);
            return data?.data?.data || data?.data || data;
        },
        enabled: !!id && !state?.editData,
    });

    const initialData = state?.editData || fetchedData;

    // حقول النموذج بناءً على هيكل الـ JSON المطلوب
    const fields = [
        { name: 'name', label: t('name') || 'الاسم بالإنجليزية', required: true },
        { name: 'nameAr', label: t('nameAr') || 'الاسم بالعربية', required: true },
        { name: 'nameFr', label: t('nameFr') || 'الاسم بالفرنسية', required: true },
        { name: 'firstOrderCount', label: t('firstOrderCount') || 'عدد الطلبات الأولى', type: 'number', required: true },
        {
            name: 'discountType',
            label: t('discountType') || 'نوع الخصم',
            type: 'select',
            options: [
                { label: 'نسبة مئوية (Percentage)', value: 'percentage' },
                { label: 'قيمة ثابتة (Fixed)', value: 'fixed' }
            ],
            required: true
        },
        { name: 'discountValue', label: t('discountValue') || 'قيمة الخصم', type: 'number', required: true },
        { name: 'maxDiscountAmount', label: t('maxDiscountAmount') || 'الحد الأقصى لمبلغ الخصم', type: 'number', required: true },
        { name: 'maxUsage', label: t('maxUsage') || 'الحد الأقصى للاستخدام العام', type: 'number', required: true },
        { name: 'maxUsagePerUser', label: t('maxUsagePerUser') || 'الحد الأقصى للاستخدام لكل مستخدم', type: 'number', required: true },
        { name: 'startDate', label: t('startDate') || 'تاريخ البداية', type: 'date', required: true },
        { name: 'endDate', label: t('endDate') || 'تاريخ النهاية', type: 'date', required: true },
        {
            name: 'status',
            label: t('status') || 'الحالة',
            type: 'select',
            options: [
                { label: t('active') || 'نشط', value: 'active' },
                { label: t('inactive') || 'غير نشط', value: 'inactive' }
            ],
            required: true
        },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={t('firstOrderDiscountSettings') || 'إعدادات خصم الطلب الأول'}
            apiUrl={baseUrl}
            queryKey="first-order-discounts"
            fields={fields}
            initialData={initialData}
            transformPayload={(data) => ({
                ...data,
                // 💡 تحويل القيم العددية إلى Numbers صريحة بدلاً من Strings
                firstOrderCount: data.firstOrderCount !== undefined && data.firstOrderCount !== '' ? Number(data.firstOrderCount) : null,
                discountValue: data.discountValue !== undefined && data.discountValue !== '' ? Number(data.discountValue) : null,
                maxDiscountAmount: data.maxDiscountAmount !== undefined && data.maxDiscountAmount !== '' ? Number(data.maxDiscountAmount) : null,
                maxUsage: data.maxUsage !== undefined && data.maxUsage !== '' ? Number(data.maxUsage) : null,
                maxUsagePerUser: data.maxUsagePerUser !== undefined && data.maxUsagePerUser !== '' ? Number(data.maxUsagePerUser) : null,

                // تحويل التواريخ لصيغة ISO المطلوبة لتجنب خطأ الـ Validation
                startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
                endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
            })}
            onSuccessAction={() => navigate('/first-order-discounts')}
        />
    );
};

export default FirstOrderDiscountAdd;