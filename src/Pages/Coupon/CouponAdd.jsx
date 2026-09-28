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

    // حالة لتتبع نوع استخدام المستخدم (fixed أو unlimited)
    const [userUsageType, setUserUsageType] = useState('fixed');
    
    // حالة لتتبع نوع حد الاستخدام العام للكوبون
    const [usageLimitType, setUsageLimitType] = useState('fixed');

    // تعيين القيم عند جلب بيانات التعديل
    useEffect(() => {
        if (initialData) {
            if (initialData.userUsageType) {
                setUserUsageType(initialData.userUsageType);
            }
            
            // تعيين حالة usageLimitType عند التعديل
            if (initialData.usageLimitType) {
                setUsageLimitType(initialData.usageLimitType);
            } else if (initialData.usageLimit === null || initialData.usageLimit === undefined) {
                // إذا لم يكن هناك حد استخدام مخزن، نعتبره غير محدود
                setUsageLimitType('unlimited');
            } else {
                setUsageLimitType('fixed');
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
        
        // حقل نوع حد الاستخدام العام (الجديد)
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

        // إظهار حقل usageLimit فقط إذا كان usageLimitType هو fixed
        ...(usageLimitType === 'fixed' ? [
            { name: 'usageLimit', label: t('usageLimit') || 'Usage Limit', type: 'number', required: false }
        ] : []),

        // نوع استخدام الكوبون للمستخدم
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

        // إظهار حقل perUserLimit فقط إذا كان userUsageType هو fixed
        ...(userUsageType === 'fixed' ? [
            {
                name: 'perUserLimit',
                label: t('perUserLimit') || 'Per User Limit',
                type: 'number',
                required: false,
                defaultValue: 3
            }
        ] : []),

        // تفعيل أو تعطيل الكوبون باستخدام Switch
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
            apiUrl="/api/restaurant/Coupons"
            queryKey="Coupons"
            fields={CouponFields}
            initialData={initialData}
            transformData={(data) => {
                let formattedData = { ...data };

                // معالجة المطاعم
                if (formattedData.restaurantIds && formattedData.restaurantIds.trim() !== '') {
                     if (typeof formattedData.restaurantIds === 'string') {
                         formattedData.restaurantIds = formattedData.restaurantIds.split(',').map(id => id.trim());
                     }
                } else {
                     formattedData.restaurantId = [];
                     delete formattedData.restaurantIds;
                }

                // معالجة حد الاستخدام العام للكوبون
                if (formattedData.usageLimitType === 'unlimited') {
                    delete formattedData.usageLimit;
                } else {
                    formattedData.usageLimit = Number(formattedData.usageLimit) || null;
                }

                // معالجة حد الاستخدام للمستخدم
                if (formattedData.userUsageType === 'fixed') {
                    formattedData.perUserLimit = Number(formattedData.perUserLimit) || 2; 
                } else {
                    delete formattedData.perUserLimit;
                }

                // التأكد من أن isActive يتم إرسالها كـ Boolean
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