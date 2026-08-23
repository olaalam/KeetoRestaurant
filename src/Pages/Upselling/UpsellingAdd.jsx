import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AddPage from '@/components/AddPage'; // تأكدي من مسار الاستيراد
import { useGet } from '@/hooks/useGet'; // تأكدي من مسار الاستيراد

const UpsellingAdd = () => {
    const navigate = useNavigate();

    // جلب المنتجات لملء القوائم المنسدلة
    const { data: foodsResponse, isLoading } = useGet(
        'foods-select', 
        '/api/restaurant/recommended-foods/foods-select'
    );

    // تحويل البيانات لشكل { label, value } المتوافق مع الـ Components
    const foodOptions = useMemo(() => {
        // استخراج المصفوفة بناءً على هيكل الـ JSON الخاص بك
        const foodsArray = foodsResponse?.data?.data; 
        
        if (!Array.isArray(foodsArray)) return [];

        return foodsArray.map(food => ({
            // استخدام الاسم الإنجليزي، وإن كان فارغاً نستخدم العربي كبديل
            label: food.name || food.nameAr || "بدون اسم", 
            value: food.id 
        }));
    }, [foodsResponse]);

    // تجهيز الحقول المطلوبة لـ AddPage
    const fields = [
        {
            name: 'foodId',
            label: 'Main Food Item (المنتج الأساسي)',
            type: 'combobox',
            required: true,
            options: foodOptions,
        },
        {
            name: 'recommendedFoodIds',
            label: 'Upselling Products (المنتجات المقترحة)',
            type: 'multi-select',
            required: true,
            options: foodOptions,
        }
    ];

    if (isLoading) return <div className="p-4 text-center">جاري تحميل المنتجات...</div>;

    return (
        <div className="p-6">
            <AddPage
                title="Upselling Products"
                apiUrl="/api/restaurant/recommended-foods/assign"
                queryKey="recommended-foods"
                method="POST"
                fields={fields}
                onSuccessAction={() => navigate('/upselling')} // العودة لصفحة العرض بعد النجاح
            />
        </div>
    );
};

export default UpsellingAdd;