// CouponAdd.jsx
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

    // جلب قائمة الأطعمة من الـ API مع تصحيح مسار الـ Response (res.data.data.data)
    const { data: foodsResponse } = useQuery({
        queryKey: ['restaurant-foods-list'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/food');
            return res.data?.data?.data || res.data?.data || [];
        }
    });

    // تحويل الأطعمة إلى خيارات تناسب الـ multi-select
    const foodOptions = React.useMemo(() => {
        if (!foodsResponse || !Array.isArray(foodsResponse)) return [];
        return foodsResponse.map(food => ({
            value: String(food.id),
            label: food.name || food.nameAr || food.title || `Food #${food.id}`
        }));
    }, [foodsResponse]);

    const [userUsageType, setUserUsageType] = useState('fixed');
    const [usageLimitType, setUsageLimitType] = useState('fixed');

    useEffect(() => {
        if (initialData) {
            if (initialData.userUsageType) {
                setUserUsageType(initialData.userUsageType);
            }
            if (initialData.usageLimitType) {
                setUsageLimitType(initialData.usageLimitType);
            } else if (initialData.usageLimit === null || initialData.usageLimit === undefined) {
                setUsageLimitType('unlimited');
            } else {
                setUsageLimitType('fixed');
            }

            // معالجة الـ foodsId أو foods القادمة من الـ API لتتوافق مع الـ multi-select
            const rawFoods = initialData.foodsId || initialData.foods;
            if (rawFoods && Array.isArray(rawFoods)) {
                initialData.foodsId = rawFoods.map(f => typeof f === 'object' && f !== null ? String(f.id) : String(f));
            }
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
            ]
        },
        { name: 'discountValue', label: t('discountValue'), type: 'number', required: true },
        { name: 'maxDiscount', label: t('maxDiscount') || 'Max Discount', type: 'number', required: false },
        { name: 'minOrderAmount', label: t('minOrderAmount') || 'Min Order Amount', type: 'number', required: false },
        
        // حقل اختيار الأطعمة المتعدد (Multi-select) بالاسم المطلوبة foodsId
        {
            name: 'foodsId',
            label: t('foods') || 'الأطعمة المشمولة',
            type: 'multi-select',
            required: false,
            options: foodOptions
        },

        {
            name: 'usageLimitType',
            label: t('usageLimitType') || 'Usage Limit Type',
            required: true,
            type: 'select',
            options: [
                { value: 'fixed', label: t('fixed') || 'Fixed' },
                { value: 'unlimited', label: t('unlimited') || 'Unlimited' }
            ],
            onChange: (e) => {
                const value = e?.target ? e.target.value : e;
                setUsageLimitType(value);
            }
        },

        ...(usageLimitType === 'fixed' ? [
            { name: 'usageLimit', label: t('usageLimit') || 'Usage Limit', type: 'number', required: false }
        ] : []),

        {
            name: 'userUsageType',
            label: t('userUsageType') || 'User Usage Type',
            required: true,
            type: 'select',
            options: [
                { value: 'fixed', label: t('fixed') || 'Fixed' },
                { value: 'unlimited', label: t('unlimited') || 'Unlimited' }
            ],
            onChange: (e) => {
                const value = e?.target ? e.target.value : e;
                setUserUsageType(value);
            }
        },

        ...(userUsageType === 'fixed' ? [
            {
                name: 'perUserLimit',
                label: t('perUserLimit') || 'Per User Limit',
                type: 'number',
                required: false,
                defaultValue: 3
            }
        ] : []),

        {
            name: 'isActive',
            label: t('isActive') || 'Is Active',
            type: 'switch', 
            required: false,
            defaultValue: true
        },

        { name: 'startDate', label: t('startDate'), type: 'date', required: true },
        { name: 'endDate', label: t('endDate'), type: 'date', required: true },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="Coupon"
            apiUrl="/api/restaurant/coupons"
            queryKey="coupons"
            fields={CouponFields}
            initialData={initialData}
            transformPayload={(data) => {
                let formattedData = { ...data };

                // التأكد من إرسال foodsId كأرقام أو نصوص صحيحة حسب متطلبات الباك إند
                if (formattedData.foodsId && Array.isArray(formattedData.foodsId)) {
                    formattedData.foodsId = formattedData.foodsId.map(id => String(id));
                } else {
                    formattedData.foodsId = [];
                }

                if (formattedData.usageLimitType === 'unlimited') {
                    delete formattedData.usageLimit;
                } else {
                    formattedData.usageLimit = Number(formattedData.usageLimit) || null;
                }

                if (formattedData.userUsageType === 'fixed') {
                    formattedData.perUserLimit = Number(formattedData.perUserLimit) || 2; 
                } else {
                    delete formattedData.perUserLimit;
                }

                formattedData.isActive = !!formattedData.isActive;

                return formattedData;
            }}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default CouponAdd;