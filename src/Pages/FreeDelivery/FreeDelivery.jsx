import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable';
import { useGet } from '@/hooks/useGet';

export default function FreeDelivery() {
    const navigate = useNavigate();
    const apiUrl = "/api/restaurant/free-delivery";
    const queryKey = "free-delivery-list";

    // جلب البيانات باستخدام الكاستم هوك
    const { data, isLoading } = useGet(queryKey, apiUrl);

    // تعريف الأعمدة بناءً على البيانات
    const columns = [
        {
            accessorKey: "minOrderAmount",
            header: "Min Order Amount",
            cell: ({ row }) => <span className="font-semibold">{row.original.minOrderAmount}</span>
        },
        {
            accessorKey: "startDate",
            header: "Start Date",
            // التحقق من وجود التاريخ لتجنب الأخطاء
            cell: ({ row }) => row.original.startDate 
                ? new Date(row.original.startDate).toLocaleDateString() 
                : "N/A"
        },
        {
            accessorKey: "endDate",
            header: "End Date",
             // التحقق من وجود التاريخ لتجنب الأخطاء
            cell: ({ row }) => row.original.endDate 
                ? new Date(row.original.endDate).toLocaleDateString() 
                : "N/A"
        },
        {
            // سيتم تحويله تلقائياً إلى Switch لأن اسمه status
            accessorKey: "status", 
            header: "Status",
        }
    ];

    // معالجة البيانات بذكاء باستخدام useMemo لتجنب إعادة الحسابات غير الضرورية
    const tableData = useMemo(() => {
        if (!data) return [];

        // استخراج البيانات بناءً على الهيكل: { success: true, data: { data: { id: "..." } } }
        const actualData = data?.data?.data || data?.data || data;

        // إذا كان actualData كائناً يحتوي على id (مثل الرد الذي أرسلته)، ضعه في مصفوفة
        if (actualData && !Array.isArray(actualData) && actualData.id) {
            return [actualData];
        }
        
        // إذا كان بالفعل مصفوفة (في حالة تغير الـ API مستقبلاً ليدعم عروض متعددة)
        if (Array.isArray(actualData)) {
            return actualData;
        }

        return [];
    }, [data]);

    // تحديد ما إذا كان يجب عرض زر "إضافة".
    // إذا كان هناك بيانات بالفعل (مثل عرض واحد نشط)، فقد لا نحتاج لزر الإضافة.
    // يمكنك إزالة هذا الشرط وتمرير الدالة مباشرة إذا كان النظام يسمح بعروض متعددة.
    const handleAdd = tableData.length === 0 ? () => navigate('/free-delivery/add') : undefined;


    return (
        <div className="p-6">
            <GenericDataTable
                title="Free Delivery"
                columns={columns}
                data={tableData}
                isLoading={isLoading}
                queryKey={queryKey}
                editApiUrl={apiUrl} // مهم لتشغيل زر الـ Switch وتغيير الحالة[cite: 2]
                deleteApiUrl={apiUrl} // لتشغيل زر الحذف[cite: 2]
                onAdd={handleAdd} // يعرض زر الإضافة فقط إذا لم يكن هناك عرض حالي
                onEdit={(row) => navigate(`/free-delivery/edit`, { state: { initialData: row } })}
            />
        </div>
    );
}