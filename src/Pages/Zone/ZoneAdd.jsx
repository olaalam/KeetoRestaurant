import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import MapComponent from '@/components/MapComponent';
import { MapPin } from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';

const ZoneAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isEdit = !!id;
    const [location, setLocation] = useState({ lat: 30.0444, lng: 31.2357 });

    // 1. جلب قائمة المدن
    const { data: cities = [], isLoading: isLoadingCities } = useQuery({
        queryKey: ['cities'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/zones/cities/active');
            return res.data.data.data;
        }
    });

    // 2. جلب بيانات الـ Zone في حالة التعديل
    const { data: fetchedData, isLoading: isFetching } = useQuery({
        queryKey: ['zone', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/zones/${id}`);
            const raw = data.data.data;
            return {
                ...raw,
                cityId: raw.cityId ? String(raw.cityId) : (raw.city?.id ? String(raw.city.id) : ""),
                lat: String(raw.lat || ""),
                lng: String(raw.lng || ""),
            };
        },
        enabled: !!id && !state?.zoneData,
    });

    // 3. جلب كل المناطق عشان تترسم كخلفية (Background Zones)
    const { data: allZones = [] } = useQuery({
        queryKey: ['all-zones'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurant-zone-delivery-fees');
            return res.data.data || [];
        }
    });

    // 4. فلترة المناطق (نستبعد المنطقة الحالية اللي بتتعدل عشان ما تترسمش مرتين)
    const backgroundZones = allZones.filter(zone => String(zone.id) !== String(id));

    const initialData = state?.zoneData || fetchedData;

    useEffect(() => {
        // لو فيه داتا جاية من التعديل، حدث الموقع المحلي فوراً
        if (fetchedData?.lat && fetchedData?.lng) {
            const newLat = parseFloat(fetchedData.lat);
            const newLng = parseFloat(fetchedData.lng);

            setLocation({ lat: newLat, lng: newLng });
        }
    }, [fetchedData]);

    // تحديث موقع الخريطة عند تحميل البيانات
    useEffect(() => {
        if (initialData?.lat && initialData?.lng) {
            setLocation({
                lat: parseFloat(initialData.lat),
                lng: parseFloat(initialData.lng)
            });
        }
    }, [initialData]);

    if (id && (isFetching || isLoadingCities)) return <LoadingSpinner />;

    const fields = [
        { name: 'name', label: t('zoneName'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        { name: 'displayName', label: t('name'), required: true },
        {
            name: 'cityId',
            label: t('cities'),
            type: 'select',
            required: true,
            options: cities?.map(c => ({ label: c.name, value: c.id }))
        },
    ];

    return (
        <AddPage
            title="Zone"
            apiUrl="/api/restaurant/zones"
            queryKey="zones"
            fields={fields}
            initialData={initialData}
            onSuccessAction={() => navigate(-1)}
        >
            {(methods) => (
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-primary w-5 h-5" />
                        <h3 className="text-lg font-semibold">Zone Location</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Click on the map or drag the marker to set the zone's exact location.
                        Use the Undo / Redo buttons (or Ctrl+Z) to go back to the previous location.
                    </p>

                    <div className="border rounded-xl p-1 relative">
                        {/*
                            الـ MapComponent الجديد فيه زرار Undo / Redo جاهز جواه،
                            وبيتعامل مع الكليك والسحب والبحث لوحده، فمش محتاجين
                            handleMapClick ولا onMarkerDragEnd هنا.
                        */}
                        <MapComponent
                            form={methods}
                            selectedLocation={location}
                            setLocationState={setLocation}
                            isMapClickEnabled={true}
                            backgroundZones={backgroundZones}
                        />
                    </div>
                </div>
            )}
        </AddPage>
    );
};

export default ZoneAdd;