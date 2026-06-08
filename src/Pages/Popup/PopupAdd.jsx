import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

const PopupAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const { t } = useTranslation(); // تفعيل الهوك

    // جلب بيانات الصورة المحددة في حالة التعديل
    const { data: popupData, isLoading: isFetching } = useQuery({
        queryKey: ['popup', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/popups/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.popupData,
    });

    const rawData = state?.popupData || popupData;

    // تجهيز البيانات الابتدائية للفورم وتنظيفها
    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        const { ...restOfData } = rawData;

        return {
            ...restOfData,
        };
    }, [rawData]);

    // الحقول المطلوبة للفورم مترجمة بالكامل
    const popupFields = [
        {
            name: 'image',
            label: t('image'),
            type: 'file',
            required: !initialData
        },

        {
            name: 'imageAr',
            label: t('imageAr'),
            type: 'file',
            required: true
        },
        {
            name: 'imageFr',
            label: t('imageFr'),
            type: 'file',
            required: true
        },

        {
            name: 'Title',
            label: t('Title'),
            type: 'text',
            required: true
        }

        ,
        {
            name: 'TitleAr',
            label: t('TitleAr'),
            type: 'text',
            required: true
        },
        {
            name: 'TitleFr',
            label: t('TitleFr'),
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
        {
            name: 'descriptionAr',
            label: t('DescriptionAr'),
            type: 'textarea',
            required: true
        },
        {
            name: 'descriptionFr',
            label: t('DescriptionFr'),
            type: 'textarea',
            required: true
        }
        ,
        {
            name: 'status',
            label: t('Status'),
            type: 'select',
            options: [
                { value: 'active', label: t('Active') },
                { value: 'inactive', label: t('Inactive') },
            ],
            required: true
        },
        {
            name: 'type',
            label: t('type'),
            type: 'select',
            options: [
                { value: "mykeeto_app", label: t('mykeeto_app') },
                { value: 'web', label: t('web') },
                { value: 'home_web', label: t('home_web') },
                { value: 'home_app', label: t('home_app') },
            ],
            required: true
        },
        
        {
            name: 'startDate',
            label: t('startDate'),
            type: 'date',
            required: true
        },
        
        {
            name: 'endDate',
            label: t('endDate'),
            type: 'date',
            required: true
        },


    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("restaurantpopups")}
            apiUrl="/api/restaurant/popups"
            queryKey="popups"
            fields={popupFields}
            initialData={initialData}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default PopupAdd;