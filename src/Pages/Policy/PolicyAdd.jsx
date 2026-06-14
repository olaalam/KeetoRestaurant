import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

const PolicyAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const { t } = useTranslation(); // تفعيل الهوك

    // جلب بيانات الصورة المحددة في حالة التعديل
    const { data: policyData, isLoading: isFetching } = useQuery({
        queryKey: ['policy', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/policy/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.policyData,
    });

    const rawData = state?.policyData || policyData;

    // تجهيز البيانات الابتدائية للفورم وتنظيفها
    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        const { ...restOfData } = rawData;

        return {
            ...restOfData,
        };
    }, [rawData]);

    // الحقول المطلوبة للفورم مترجمة بالكامل
    const policyFields = [


        {
            name: 'title',
            label: t('Title'),
            type: 'text',
            required: true
        }
        ,
        {
            name: 'description',
            label: t('Description'),
            type: 'textarea',
            required: true
        }
        ,



    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("restaurantpolicy")}
            apiUrl="/api/restaurant/policy"
            queryKey="policys"
            fields={policyFields}
            initialData={initialData}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default PolicyAdd;