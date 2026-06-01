import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";

const DeliveryZoneAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const { t } = useTranslation();

    // 1. حالة لتخزين المدينة المختارة
    const [selectedCityId, setSelectedCityId] = useState('');

    // 2. جلب قائمة المدن والمناطق من الـ API
    const { data: selectionData = { zones: [], cities: [] }, isLoading: isLoadingZones } = useQuery({
        queryKey: ['DeliveryZonesSelect'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurant-zone-delivery-fees/select');
            // استخراج المدن والمناطق بناءً على شكل الداتا المرفق
            const responseData = res.data?.data?.data || {};
            return {
                zones: responseData.zonesselect || [],
                cities: responseData.citiesselect || []
            };
        }
    });

    const { data: fetchedData, isLoading: isFetchingItem } = useQuery({
        queryKey: ['DeliveryZone', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/restaurant-zone-delivery-fees/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.zoneDeliveryData,
    });

    const rawData = state?.zoneDeliveryData || fetchedData;

    // 3. تحويل البيانات (Mapping) واستخراج cityId في حالة التعديل
    const initialData = useMemo(() => {
        if (!rawData) return null;

        const zoneId = rawData.zone?.id || rawData.zoneId;
        // البحث عن المدينة الخاصة بالمنطقة الحالية
        const zone = selectionData.zones.find(z => z.id === zoneId);
        const cityId = zone?.cityId || rawData.cityId || '';

        return {
            ...rawData,
            cityId: cityId, // دمج الـ cityId لتظهر القيمة الافتراضية
            zoneId: zoneId,
            deliveryFee: rawData.deliveryFee
        };
    }, [rawData, selectionData.zones]);

    // 4. تعيين المدينة كقيمة افتراضية عند تحميل بيانات التعديل
    useEffect(() => {
        if (initialData?.cityId && !selectedCityId) {
            setSelectedCityId(initialData.cityId);
        }
    }, [initialData, selectedCityId]);

    // 5. تصفية المناطق بناءً على المدينة المختارة
const filteredZones = useMemo(() => {
    if (!selectedCityId) return [];
    
    // طباعة للبيانات للتأكد من الأسماء والقيم أثناء التجربة (يمكنك حذفها لاحقاً)
    console.log("Selected City ID:", selectedCityId);
    console.log("First Zone Example:", selectionData.zones[0]);

    return selectionData.zones.filter(z => 
        String(z.cityId) === String(selectedCityId) // توحيد نوع البيانات هنا
    );
}, [selectedCityId, selectionData.zones]);

    // 6. إعداد حقول الفورم
    const zoneDeliveryFields = [
        {
            name: 'cityId',
            label: t('city'),
            required: true,
            type: 'select',
            options: selectionData.cities.map(c => ({
                value: String(c.id),
                label: c.name // يمكن تغييرها لـ c.nameAr إذا كنتِ تدعمين العربية هنا
            })),
            // تحديث الـ State عند تغيير المدينة
            onChange: (e) => {
                // بعض المكتبات ترجع الحدث (Event) وبعضها يرجع القيمة مباشرة
                const value = e?.target?.value !== undefined ? e.target.value : e;
                setSelectedCityId(value);
            }
        },
        {
            name: 'zoneId',
            label: t('zone'),
            required: true,
            type: 'select',
            options: filteredZones.map(z => ({
                value: String(z.id),
                label: z.name
            })),
            disabled: !selectedCityId // تعطيل الحقل إذا لم يتم اختيار مدينة
        },
        {
            name: 'deliveryFee',
            label: t('deliveryFee'),
            required: true,
            type: 'number'
        },
    ];

    if (isLoadingZones || (id && isFetchingItem)) return <LoadingSpinner />;

    return (
        <AddPage
            title={t('deliveryZoneFee')}
            apiUrl="/api/restaurant/restaurant-zone-delivery-fees"
            queryKey="DeliveryZone"
            fields={zoneDeliveryFields}
            initialData={initialData}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default DeliveryZoneAdd;