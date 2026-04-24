import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const IngredientCategoryAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();



    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: ingredientCategoryData, isLoading: isFetching } = useQuery({
        queryKey: ['ingredientCategory', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/ingredientcategory/${id}`);

            // بناءً على الـ JSON: البيانات موجودة داخل data.data.data وهي مصفوفة
            // نأخذ العنصر الأول [0]
            if (data?.data?.data && Array.isArray(data.data.data)) {
                return data.data.data[0];
            }

            return data?.data; // fallback في حال كان الهيكل مختلفاً
        },
        enabled: !!id && !state?.ingredientCategoryData,
    });

    const rawData = state?.ingredientCategoryData || ingredientCategoryData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            ...rawData,
            // هنا بنخرج الـ id من جوه كائن الـ country ونحطه في countryId 
            // عشان الـ AddPage والـ Select يحسوا بيه
            //ingredientcategoryId: rawData.ingredientcategoryId || rawData.ingredientCategory?.id
        };
    }, [rawData]);

    const ingredientCategoryFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        { name: 'status', label: 'status', required: true, type: 'select', options: [{ value: 'active', label: 'active' }, { value: 'inactive', label: 'inactive' }] },

    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="Ingredient Category"
            apiUrl="/api/restaurant/ingredientcategory" // هذا هو الـ Base URL
            queryKey="ingredientcategory"
            fields={ingredientCategoryFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default IngredientCategoryAdd;