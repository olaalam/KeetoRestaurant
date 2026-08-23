import React from 'react';
import GenericDataTable from '@/components/GenericDataTable'; // تأكدي من المسار الصحيح
import { useGet } from '@/hooks/useGet'; // تأكدي من المسار الصحيح
import { useTranslation } from '@/hooks/useTranslation';

const BlockedUsers = () => {
    const { t } = useTranslation();

    // جلب قائمة المستخدمين المحظورين
    const { data: blockedUsersResponse, isLoading } = useGet(
        'blocked-users', 
        '/api/restaurant/restaurant-users/blocked'
    );

    // تجهيز الأعمدة (تأكدي من مطابقة accessorKey لأسماء الحقول الراجعة من الـ API)
    const columns = [
        {
            accessorKey: 'name', 
            header: t("name") || "Name",
        },
        {
            accessorKey: 'email', 
            header: t("email") || "Email",
        },
        {
            accessorKey: 'phone', 
            header: t("phone") || "Phone",
        },
        {
            accessorKey: 'status', 
            header: t("status") || "Status",
            // 💡 سيقوم GenericDataTable تلقائياً بتحويل هذا الحقل إلى Switch (زر تفعيل/إلغاء)
            // لأننا أسميناه 'status' وسنمرر editApiUrl للجدول
        }
    ];

    // استخراج المصفوفة من الرد (تعدل حسب هيكل الـ JSON الراجع من الباك اند)
    const tableData = blockedUsersResponse?.data?.data || blockedUsersResponse?.data || [];

    return (
        <div className="p-6">
            <GenericDataTable
                title={t("blockedUsers") || "Blocked Users"}
                columns={columns}
                data={tableData}
                isLoading={isLoading}
                queryKey="blocked-users"
                
                // 💡 نمرر رابط التعديل هنا لكي يعمل زر السويتش (Status Toggle)
                // عندما تقومين بتشغيل السويتش، سيرسل طلب PUT إلى: /api/restaurant/restaurant-users/{id}
                editApiUrl="/api/restaurant/restaurant-users" 
                
                // إذا كان هناك رابط لحذف المستخدم نهائياً، أضيفيه هنا، وإلا اتركيه فارغاً أو احذفيه
                deleteApiUrl="/api/restaurant/restaurant-users" 
                
                // أوقفنا زر الإضافة لأن هذه صفحة عرض للمحظورين فقط
                actions={true} 
            />
        </div>
    );
};

export default BlockedUsers;