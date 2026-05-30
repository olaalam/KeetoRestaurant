import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد الهوك

const IngredientsAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: ingredientCategories = [], isLoading } = useQuery({
        queryKey: ['ingredientCategories'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/ingredients/select');
            return res.data.data.data; 
        }
    });

    const { data: ingredientData, isLoading: isFetching } = useQuery({
        queryKey: ['ingredient', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/ingredients/${id}`);
            if (data?.data?.data && Array.isArray(data.data.data)) {
                return data.data.data[0];
            }
            return data?.data; 
        },
        enabled: !!id && !state?.ingredientData, 
    });

    const rawData = state?.ingredientData || ingredientData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;
        return {
            ...rawData,
            categoryId: rawData.categoryId || rawData.category?.id
        };
    }, [rawData]);

    const ingredientFields = [
        { name: 'name', label: t('nameEn'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        {
            name: 'categoryId',
            label: t('category'),
            required: true,
            type: 'select',
            options: ingredientCategories.map(c => ({ value: c.id, label: c.name }))
        },
        { 
            name: "inStock", 
            label: t('stockStatus'), 
            type: "select", 
            required: true, 
            options: [
                { value: "true", label: t('inStock') }, 
                { value: "false", label: t('outOfStock') }
            ] 
        },
    ];

    if (id && (isFetching || isLoading)) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("ingredient")}
            apiUrl="/api/restaurant/ingredients" 
            queryKey="ingredients"
            fields={ingredientFields}
            initialData={initialData} 
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default IngredientsAdd;