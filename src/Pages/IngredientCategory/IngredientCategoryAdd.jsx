import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد الهوك

const IngredientCategoryAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: ingredientCategoryData, isLoading: isFetching } = useQuery({
        queryKey: ['ingredientCategory', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/ingredientcategory/${id}`);
            if (data?.data?.data && Array.isArray(data.data.data)) {
                return data.data.data[0];
            }
            return data?.data; 
        },
        enabled: !!id && !state?.ingredientCategoryData,
    });

    const rawData = state?.ingredientCategoryData || ingredientCategoryData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;
        return { ...rawData };
    }, [rawData]);

    const ingredientCategoryFields = [
        { name: 'name', label: t('nameEn'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        { 
            name: 'status', 
            label: t('status'), 
            required: true, 
            type: 'select', 
            options: [
                { value: 'active', label: t('active') }, 
                { value: 'inactive', label: t('inactive') }
            ] 
        },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("ingredientCategory")}
            apiUrl="/api/restaurant/ingredientcategory" 
            queryKey="ingredientcategory"
            fields={ingredientCategoryFields}
            initialData={initialData} 
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default IngredientCategoryAdd;