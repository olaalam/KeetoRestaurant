import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";

const SliderAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();
    const { t } = useTranslation();

    const [selectedLinkType, setSelectedLinkType] = useState('');

    const { data: sliderData, isLoading: isFetching } = useQuery({
        queryKey: ['slider', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/slider/${id}`);
            return data.data.data; 
        },
        enabled: !!id && !state?.sliderData, 
    });

    const { data: linkOptionsData = {} } = useQuery({
        queryKey: ['linkOptions'],
        queryFn: async () => {
            const { data } = await api.get('/api/restaurant/popups/link-options');
            return data.data.data || {}; 
        }
    });

    const rawData = state?.sliderData || sliderData;

    const initialData = useMemo(() => {
        if (!rawData) return null;
        const { periorty, ...restOfData } = rawData;
        return {
            ...restOfData,
            periorty: rawData.periorty || periorty 
        };
    }, [rawData]);

    useEffect(() => {
        if (initialData?.linkType) {
            setSelectedLinkType(initialData.linkType);
        }
    }, [initialData]);

    const types = linkOptionsData.types || [];
    const categories = linkOptionsData.categories || [];
    const subcategories = linkOptionsData.subcategories || [];
    const products = linkOptionsData.products || [];
    const discounts = linkOptionsData.discounts || [];

    const sliderFields = [
        { 
            name: 'img', 
            label: t('sliderFile'), 
            type: 'file', 
            required: !initialData 
        },
        { 
            name: 'periorty', 
            label: t('priority'), 
            type: 'number', 
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

    switch (selectedLinkType) {
        case 'link':
            sliderFields.push({
                name: 'link',
                label: t('link') || 'Link URL',
                type: 'text',
                required: true
            });
            break;

        case 'category':
            sliderFields.push({
                name: 'categoryId',
                label: t('category') || 'Category',
                type: 'select',
                options: categories.map(cat => ({ label: cat.name, value: cat.id })),
                required: true
            });
            break;

        case 'subcategory':
            sliderFields.push({
                name: 'subcategoryId',
                label: t('subcategory') || 'Subcategory',
                type: 'select',
                options: subcategories.map(sub => ({ label: sub.name, value: sub.id })),
                required: true
            });
            break;

        case 'product':
        case 'food':
            sliderFields.push({
                name: 'foodId',
                label: t('product') || 'Product',
                type: 'select',
                options: products.map(prod => ({ label: prod.name, value: prod.id })),
                required: true
            });
            break;

        case 'discount':
            sliderFields.push({
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

    // دالة لتنظيف الـ Payload وإزالة الحقول المتروكة فارغة أو غير التابعة للنوع المختار
    const transformData = (data) => {
        const cleanedData = { ...data };
        const linkRelatedFields = ['link', 'categoryId', 'subcategoryId', 'foodId', 'discountId'];

        // تحديد الحقل الصحيح بناءً على linkType
        const fieldMap = {
            link: 'link',
            category: 'categoryId',
            subcategory: 'subcategoryId',
            product: 'foodId',
            food: 'foodId',
            discount: 'discountId'
        };

        const activeField = fieldMap[cleanedData.linkType];

        // حذف كل الحقول الخاصة باللينكات ما عدا الحقل النشط فقط
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
            title={t("restaurantSlider")}
            apiUrl="/api/restaurant/slider" 
            queryKey="sliders" 
            fields={sliderFields}
            initialData={initialData} 
            transformData={transformData}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default SliderAdd;