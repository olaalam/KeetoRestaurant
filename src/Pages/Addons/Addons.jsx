import React, { useState, useEffect } from 'react'; // 💡 تم إضافة useState و useEffect
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useLocation } from 'react-router-dom'; // 💡 تم إضافة useLocation
import { useTranslation } from "@/hooks/useTranslation";

export default function Addons() {
    const navigate = useNavigate();
    const location = useLocation(); // 💡 لقراءة البيانات الممررة أثناء التنقل (Navigation State)
    const { t } = useTranslation();

    // 💡 State لتخزين الـ ID الخاص بالصف المراد تلوينه
    const [highlightedId, setHighlightedId] = useState(null);

    // 💡 تأثير لمراقبة إذا رجعنا من صفحة الإضافة/التعديل ومعنا ID الصف الجديد
    useEffect(() => {
        if (location.state?.highlightedId) {
            setHighlightedId(location.state.highlightedId);
            
            // مسح التلوين التلقائي بعد 4 ثوانٍ ليعود الجدول لشكلة الطبيعي
            const timer = setTimeout(() => {
                setHighlightedId(null);
                // تفريغ الـ state الخاص بالـ router حتى لا يضيء الصف مجدداً عند عمل ريفريش
                navigate(location.pathname, { replace: true, state: {} });
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [location.state, navigate, location.pathname]);

    const { data: addons = [], isLoading } = useQuery({
        queryKey: ['addons'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/addons');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('addonName') },
        { accessorKey: 'nameAr', header: t('addonNameAr') },
        { accessorKey: 'nameFr', header: t('addonNameFr') },
        { 
            accessorKey: 'price', 
            header: t('price'),
            cell: ({ row }) => `${row.getValue('price')} ${t('currency')}`
        },
        { 
            accessorKey: 'stock_type', 
            header: t('stockType'),
            cell: ({ row }) => t(row.getValue('stock_type')) 
        },
        {
            accessorKey: 'adonescategory.name',
            header: t('category'),
            cell: ({ row }) => row.original.adonescategory?.name || t('na')
        },
        // 💡 1. إضافة عمود الـ status هنا لكي يلتقطه الجدول ويحوله تلقائياً إلى Switch
        {
            accessorKey: 'status',
            header: t('status'),
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('modifier')}
                columns={columns}
                data={addons}
                isLoading={isLoading}
                queryKey="addons"
                editApiUrl="/api/restaurant/addons"   // 💡 2. تمرير رابط التعديل لتشغيل الـ Switch مباشرة
                deleteApiUrl="/api/restaurant/addons"
                onAdd={() => navigate("/addons/add")}
                onEdit={(addon) => navigate(`/addons/edit/${addon.id}`)}
                highlightedId={highlightedId}         // 💡 3. تمرير الـ ID المضيء للجدول
            />
        </div>
    );
}