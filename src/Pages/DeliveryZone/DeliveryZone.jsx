import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function DeliveryZone() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [highlightedId, setHighlightedId] = useState(null);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });

    // 💡 الحل البديل والأقوى: قراءة اللغة مباشرة من الـ Local Storage الخاص بالتطبيق
    const getLanguage = () => {
        try {
            const keetoLang = localStorage.getItem('keeto-language');
            if (keetoLang) {
                const parsed = JSON.parse(keetoLang);
                return parsed?.state?.language || 'en'; // إذا لم يجدها يجعلها إنجليزية كافتراضي
            }
        } catch (e) {
            console.error("Error parsing language from localStorage", e);
        }
        return 'en';
    };

    // فحص ما إذا كانت اللغة الحالية هي العربية
    const isArabic = getLanguage() === 'ar';

    // 1. جلب بيانات مناطق التوصيل
    const { data: deliveryFees = [], isLoading } = useQuery({
        queryKey: ['DeliveryZone'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurant-zone-delivery-fees');
            return res.data?.data?.data || [];
        }
    });

useEffect(() => {
        if (location.state?.highlightedId && deliveryFees.length) {
            // 💡 فرز البيانات بنفس منطق GenericDataTable تماماً
            const sortedDeliveryFees = [...deliveryFees].sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
            });

            // البحث في المصفوفة المُرتبة وليست الخام
            const index = sortedDeliveryFees.findIndex(item => String(item.id) === String(location.state.highlightedId));

            if (index !== -1) {
                const pageIndex = Math.floor(index / pagination.pageSize);
                setPagination(prev => ({ ...prev, pageIndex }));
                setHighlightedId(location.state.highlightedId);

                const timer = setTimeout(() => {
                    setHighlightedId(null);
                    navigate(location.pathname, { replace: true, state: {} });
                }, 3500);

                return () => clearTimeout(timer);
            }
        }
    }, [location.state, deliveryFees, pagination.pageSize, navigate, location.pathname]);

    // 2. تعريف الأعمدة لتطابق الهيكل الجديد ودعم اللغات
    const columns = [
        {
            id: 'city', // استخدمنا id بدلاً من accessorKey
            header: t('cityname'),
            // 💡 التعديل هنا: جعلنا الجدول يقرأ الاسمين معاً في الخلفية ليتمكن من البحث فيهما
            accessorFn: (row) => `${row.city?.name || ''} ${row.city?.nameAr || ''}`,
            cell: ({ row }) => {
                const city = row.original.city;
                return <span>{isArabic && city?.nameAr ? city.nameAr : (city?.name || 'N/A')}</span>;
            }
        },
        {
            id: 'zone',
            header: t('zoneName'),
            // نفس الفكرة لتفعيل البحث العربي في اسم المنطقة
            accessorFn: (row) => `${row.zone?.name || ''} ${row.zone?.nameAr || ''}`,
            cell: ({ row }) => {
                const zone = row.original.zone;
                const zoneName = isArabic && zone?.nameAr ? zone.nameAr : (zone?.name || 'N/A');
                return (
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="font-medium">{zoneName}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'deliveryFee',
            header: t('deliveryFee'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1 font-semibold text-green-600">
                    <span>{row.original.deliveryFee} EGP</span>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: t('status'),
            // الجدول العام GenericDataTable سيتولى بناء الـ Switch تلقائياً
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('deliveryFees')}
                columns={columns}
                data={deliveryFees}
                isLoading={isLoading}
                queryKey="DeliveryZone"
                deleteApiUrl="/api/restaurant/restaurant-zone-delivery-fees"
                editApiUrl="/api/restaurant/restaurant-zone-delivery-fees"
                highlightedId={highlightedId}
                pagination={pagination}
                setPagination={setPagination}
                onAdd={() => navigate("/delivery-zones/add")}
                onEdit={(item) => navigate(`/delivery-zones/edit/${item.id}`, { state: { DeliveryZoneData: item } })}
            />
        </div>
    );
}