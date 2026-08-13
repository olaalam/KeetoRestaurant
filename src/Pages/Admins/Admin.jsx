import React, { useState, useEffect } from 'react'; // 💡 تم إضافة useState و useEffect للحالة المضيئة
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useLocation } from 'react-router-dom'; // 💡 تم إضافة useLocation لقراءة البيانات الراجعة
import { useTranslation } from "@/hooks/useTranslation"; 

export default function Admin() {
    const navigate = useNavigate();
    const location = useLocation(); // 💡 لتتبع الـ State الراجع من صفحة الإضافة/التعديل
    const { t } = useTranslation(); 

    // 💡 State لتخزين الـ ID الخاص بالصف المراد تلوينه بالوميض الأصفر
    const [highlightedId, setHighlightedId] = useState(null);

    // 💡 مراقبة ما إذا كنا راجعين من صفحة الحفظ ومعنا المعرف الخاص بالعنصر
    useEffect(() => {
        if (location.state?.highlightedId) {
            setHighlightedId(location.state.highlightedId);

            const timer = setTimeout(() => {
                setHighlightedId(null);
                navigate(location.pathname, { replace: true, state: {} });
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [location.state, navigate, location.pathname]);

    const { data: admins = [], isLoading } = useQuery({
        queryKey: ['admins'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurantadmin');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('name') },
        { accessorKey: 'email', header: t('email') },
        { accessorKey: 'phoneNumber', header: t('phoneNumber') },
        {
            accessorKey: 'status',
            header: t('status'),
            // 💡 قمنا بحذف الـ cell بالكامل هنا لكي يتولى GenericDataTable توليد الـ Switch تلقائياً
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('admins')} 
                columns={columns}
                data={admins}
                isLoading={isLoading}
                queryKey="admins"
                deleteApiUrl="/api/restaurant/restaurantadmin"
                editApiUrl="/api/restaurant/restaurantadmin" // تفعيل السويتش من خلال هذا الرابط
                onAdd={() => navigate("/admins/add")}
                onEdit={(admin) => navigate(`/admins/edit/${admin.id}`)}
                highlightedId={highlightedId} // 💡 تمرير الـ ID المضيء للجدول ليقوم بتمييزه
            />
        </div>
    );
}