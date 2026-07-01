import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { MapPin } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function DeliveryZone() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // نأخذ t فقط كما هو معرف داخل الـ hook الخاص بكِ

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
                onAdd={() => navigate("/delivery-zones/add")}
                onEdit={(item) => navigate(`/delivery-zones/edit/${item.id}`, { state: { DeliveryZoneData: item } })}
            />
        </div>
    );
}