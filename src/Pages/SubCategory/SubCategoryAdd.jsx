import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";

const SubCategoryAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const { t } = useTranslation();

    const { data: lookups, isLoading: isSelectLoading } = useQuery({
        queryKey: ["food-select-options"],
        queryFn: async () => {
            const response = await api.get("/api/restaurant/food/select");
            return response.data?.data?.data || {};
        },
    });
    const categories = lookups?.categories || [];
    const addons = lookups?.addons || [];

    const { data: subcategoryData, isLoading: isFetching } = useQuery({
        queryKey: ['subcategory', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/subcategories/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.subcategoryData,
    });

    const rawData = state?.subcategoryData || subcategoryData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        let parsedAddonsIds = [];
        if (rawData.addonsIds) {
            if (Array.isArray(rawData.addonsIds)) {
                parsedAddonsIds = rawData.addonsIds;
            } else if (typeof rawData.addonsIds === 'string') {
                try {
                    parsedAddonsIds = JSON.parse(rawData.addonsIds);
                } catch (e) {
                    console.error("Error parsing addonsIds:", e);
                    parsedAddonsIds = [];
                }
            }
        }

        return {
            ...rawData,
            categoryId: rawData.categoryId || rawData.category?.id,
            order_level: rawData.order_level ? Number(rawData.order_level) : 0,
            addonsIds: parsedAddonsIds.map(id => String(id))
        };
    }, [rawData]);

    const subcategoryFields = [
        { name: 'name', label: t('name'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        {
            name: 'categoryId',
            label: t('category'),
            required: true,
            type: 'combobox',
            options: categories.map(c => ({ value: c.id, label: c.name }))
        },
        {
            name: 'addonsIds',
            label: t('addons'),
            required: false,
            type: 'multi-select',
            options: addons.map(a => ({ value: a.id, label: a.name }))
        },
        { name: 'order_level', label: t('orderLevel'), required: true, type: 'number' },
        {
            name: 'priority',
            label: t('priority'),
            required: true,
            type: 'select',
            options: [
                { value: 'low', label: t('low') },
                { value: 'medium', label: t('medium') },
                { value: 'high', label: t('high') },
            ]
        },
    ];

    if (isSelectLoading || (id && isFetching)) return <LoadingSpinner />;

    return (
        <AddPage
            title={t('subcategoryTitle')}
            apiUrl="/api/restaurant/subcategories"
            queryKey="subcategories"
            fields={subcategoryFields}
            initialData={initialData}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default SubCategoryAdd;