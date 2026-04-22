import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const DeliveryZoneAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();

    // جلب قائمة المناطق للـ Select Options
    const { data: zonesList = [], isLoading: isLoadingZones } = useQuery({
        queryKey: ['DeliveryZonesSelect'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurant-zone-delivery-fees/select');
            // التعديل هنا: الوصول للمصفوفة بناءً على هيكلة data.data.data المتوقعة
            return res.data?.data?.data || res.data?.data || [];
        }
    });

    // جلب بيانات العنصر المحدد في حالة التعديل
    const { data: fetchedData, isLoading: isFetchingItem } = useQuery({
        queryKey: ['DeliveryZone', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/restaurant-zone-delivery-fees/${id}`);
            // بناءً على الصورة: data.data.data هو الكائن الذي يحتوي id, deliveryFee, zone
            return data.data.data;
        },
        enabled: !!id && !state?.zoneDeliveryData,
    });

    const rawData = state?.zoneDeliveryData || fetchedData;

    // تحويل البيانات لتناسب الفورم (Mapping)
    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            ...rawData,
            // نربط id المنطقة بـ zoneId ليظهر في الـ Select
            zoneId: rawData.zone?.id || rawData.zoneId,
            // نستخدم deliveryFee حسب المسمى في الريسبونس
            deliveryFee: rawData.deliveryFee
        };
    }, [rawData]);

    const zoneDeliveryFields = [
        {
            name: 'zoneId',
            label: 'Zone',
            required: true,
            type: 'select',
            options: zonesList.map(z => ({
                value: String(z.id),
                label: z.name
            }))
        },
        {
            name: 'deliveryFee',
            label: 'Delivery Fee',
            required: true,
            type: 'number'
        },
    ];

    if (isLoadingZones || (id && isFetchingItem)) return <LoadingSpinner />;

    return (
        <AddPage
            title="Delivery Zone Fee"
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