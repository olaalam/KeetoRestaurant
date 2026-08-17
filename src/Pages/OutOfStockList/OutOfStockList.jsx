import React from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { useGet } from '@/hooks/useGet';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export default function OutOfStockFoods() {
    const { t, isRTL } = useTranslation();
    const navigate = useNavigate();

    // جلب البيانات من الـ API المحدد
    const { data: response, isLoading } = useGet(
        'outOfStockFoods', 
        '/api/restaurant/food/out-of-stock'
    );

    // استخراج المصفوفة بناءً على هيكل الـ JSON المرفق (response.data.data)
    const foods = response?.data?.data || [];

    // تعريف الأعمدة
    const columns = [
        { 
            accessorKey: 'name', 
            header: t('nameEn') 
        },
        { 
            accessorKey: 'nameAr', 
            header: t('nameAr') 
        },
        {
            id: 'category',
            header: t('category'),
            cell: ({ row }) => {
                const category = row.original.category;
                // عرض الاسم بالعربية أو الإنجليزية حسب اللغة الحالية للنظام
                return isRTL ? (category?.nameAr || category?.name) : (category?.name || category?.nameAr);
            }
        },
        { 
            accessorKey: 'price', 
            header: t('price') 
        },

    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("outOfStockFoods") || "Out of Stock Foods"}
                columns={columns}
                data={foods}
                isLoading={isLoading}
                queryKey="outOfStockFoods"
                actions={false} // استخدام الأعمدة المعرفة يدوياً بالأعلى
            />
        </div>
    );
}