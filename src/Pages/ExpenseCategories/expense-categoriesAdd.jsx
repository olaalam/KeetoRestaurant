import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

const ExpenseCategoriesAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();
    const { t } = useTranslation(); // تفعيل الهوك

    // جلب بيانات الصورة المحددة في حالة التعديل
    const { data: ExpenseCategoriesData, isLoading: isFetching } = useQuery({
        queryKey: ['ExpenseCategoriesAdd', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/expense-categories/${id}`);
            return data.data.data; 
        },
        enabled: !!id && !state?.ExpenseCategoriesData, 
    });

    const rawData = state?.ExpenseCategoriesData || ExpenseCategoriesData;

    // تجهيز البيانات الابتدائية للفورم وتنظيفها
    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        const { periorty, ...restOfData } = rawData;

        return {
            ...restOfData,
            periorty: rawData.periorty || periorty 
        };
    }, [rawData]);

    // الحقول المطلوبة للفورم مترجمة بالكامل
    const ExpenseCategoriesFields = [
       
        { 
            name: 'name', 
            label: t('Name'), 
            type: 'text', 
            required: true 
        },
        {
            
            name: 'arName', 
            label: t('ArabicName'), 
            type: 'text', 
            required: true 
        }
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("ExpenseCategories")}
            apiUrl="/api/restaurant/expense-categories" 
            queryKey="ExpenseCategoriesAdd" 
            fields={ExpenseCategoriesFields}
            initialData={initialData} 
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default ExpenseCategoriesAdd;