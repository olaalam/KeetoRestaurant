import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";

const PopupAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const { t } = useTranslation();

    // State لمتابعة اختيار المستخدم لنوع اللينك
    const [selectedLinkType, setSelectedLinkType] = useState('');

    // جلب بيانات الـ Popup في حالة التعديل
    const { data: popupData, isLoading: isFetching } = useQuery({
        queryKey: ['popup', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/popups/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.popupData,
    });

    // جلب خيارات اللينكات والـ Selects من الـ API
    const { data: linkOptionsData = {} } = useQuery({
        queryKey: ['linkOptions'],
        queryFn: async () => {
            const { data } = await api.get('/api/restaurant/popups/link-options');
            return data.data.data || {};
        }
    });

    const rawData = state?.popupData || popupData;

    // تجهيز البيانات الابتدائية للفورم
    const initialData = useMemo(() => {
        if (!rawData) return null;
        const { ...restOfData } = rawData;
        return {
            ...restOfData,
        };
    }, [rawData]);

    // تعيين القيمة الابتدائية لـ linkType عند التعديل
    useEffect(() => {
        if (initialData?.linkType) {
            setSelectedLinkType(initialData.linkType);
        }
    }, [initialData]);

    // استخراج القوائم من الـ API
    const types = linkOptionsData.types || [];
    const categories = linkOptionsData.categories || [];
    const subcategories = linkOptionsData.subcategories || [];
    const products = linkOptionsData.products || [];
    const discounts = linkOptionsData.discounts || [];

    // الحقول المطلوبة للفورم
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
        },
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
        },
        {
            name: 'description',
            label: t('Description'),
            type: 'textarea',
            required: true
        },
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
        },
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
        {
            name: 'linkType',
            label: t('linkType') || 'Link Type',
            type: 'select',
            options: types.map(type => ({ 
                label: type, 
                value: type 
            })),
            onChange: (val) => {
                const value = val?.target ? val.target.value : val;
                setSelectedLinkType(value);
            },
            required: false
        }
    ];

    // الشروط الديناميكية للحقل التابع لـ linkType
    switch (selectedLinkType) {
        case 'link':
            popupFields.push({
                name: 'link',
                label: t('link') || 'Link URL',
                type: 'text',
                required: true
            });
            break;

        case 'category':
            popupFields.push({
                name: 'categoryId',
                label: t('category') || 'Category',
                type: 'select',
                options: categories.map(cat => ({ label: cat.name, value: cat.id })),
                required: true
            });
            break;

        case 'subcategory':
            popupFields.push({
                name: 'subcategoryId',
                label: t('subcategory') || 'Subcategory',
                type: 'select',
                options: subcategories.map(sub => ({ label: sub.name, value: sub.id })),
                required: true
            });
            break;

        case 'product':
        case 'food':
            popupFields.push({
                name: 'foodId',
                label: t('product') || 'Product',
                type: 'select',
                options: products.map(prod => ({ label: prod.name, value: prod.id })),
                required: true
            });
            break;

        case 'discount':
            popupFields.push({
                name: 'discountId',
                label: t('discount') || 'Discount',
                type: 'select',
                options: discounts.map(disc => ({ label: disc.name, value: disc.id })),
                required: true
            });
            break;

        default:
            break;
    }

    // دالة تنظيف البيانات قبل الإرسال لمنع الـ Validation Errors
    const transformData = (data) => {
        const cleanedData = { ...data };
        const linkRelatedFields = ['link', 'categoryId', 'subcategoryId', 'foodId', 'discountId'];

        const fieldMap = {
            link: 'link',
            category: 'categoryId',
            subcategory: 'subcategoryId',
            product: 'foodId',
            food: 'foodId',
            discount: 'discountId'
        };

        const activeField = fieldMap[cleanedData.linkType];

        linkRelatedFields.forEach(field => {
            if (field !== activeField || !cleanedData[field]) {
                delete cleanedData[field];
            }
        });

        return cleanedData;
    };

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("restaurantpopups")}
            apiUrl="/api/restaurant/popups"
            queryKey="popups"
            fields={popupFields}
            initialData={initialData}
            transformData={transformData}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default PopupAdd;