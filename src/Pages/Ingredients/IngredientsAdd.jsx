import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const IngredientsAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

    const { data: ingredientCategories = [], isLoading } = useQuery({
        queryKey: ['ingredientCategories'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/ingredients/select');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: ingredientData, isLoading: isFetching } = useQuery({
        queryKey: ['ingredient', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/ingredients/${id}`);
            if (data?.data?.data && Array.isArray(data.data.data)) {
                return data.data.data[0];
            }

            return data?.data; // fallback في حال كان الهيكل مختلفاً
        },
        enabled: !!id && !state?.ingredientData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const rawData = state?.ingredientData || ingredientData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            ...rawData,
            // هنا بنخرج الـ id من جوه كائن الـ country ونحطه في countryId 
            // عشان الـ AddPage والـ Select يحسوا بيه
            categoryId: rawData.categoryId || rawData.category?.id
        };
    }, [rawData]);

    const ingredientFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        {
            name: 'categoryId',
            label: 'Category',
            required: true,
            type: 'select',
            // التأكد من أن الـ options بتستخدم الـ id والـ name الصح
            options: ingredientCategories.map(c => ({ value: c.id, label: c.name }))
        },
        { name: "inStock", label: "inStock", type: "select", required: true, options: [{ value: "true", label: "active" }, { value: "false", label: "inactive" }] },
    ];

    if (id && isFetching && isLoading) return <LoadingSpinner />;

    return (
        <AddPage
            title="ingredient"
            apiUrl="/api/restaurant/ingredients" // هذا هو الـ Base URL
            queryKey="ingredients"
            fields={ingredientFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default IngredientsAdd;