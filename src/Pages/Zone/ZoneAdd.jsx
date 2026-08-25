// استبدل الكود القديم بـ ZoneAdd.jsx بهذا الكود[cite: 4]
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

    // 1. جلب قائمة المدن[cite: 4]
    const { data: cities = [], isLoading: isLoadingCities } = useQuery({
        queryKey: ['cities'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/zones/cities/active');
            return res.data.data.data;
        }
    });

    // 2. جلب بيانات الـ Zone في حالة التعديل[cite: 4]
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

    // 3. 💡 جديد: جلب كل المناطق عشان تترسم كخلفية (Background Zones)
    const { data: allZones = [] } = useQuery({
        queryKey: ['all-zones'],
        queryFn: async () => {
            // استبدل الـ URL بالـ API الصحيح اللي بيرجع كل المناطق برسمتها (Polygon/Radius)
            // بناءً على كود ZoneMap.jsx اللي بعته، دا الـ API
            const res = await api.get('/api/restaurant/restaurant-zone-delivery-fees');
            return res.data.data || [];
        }
    });

    // 4. 💡 فلترة المناطق (نستبعد المنطقة الحالية اللي بتتعدل عشان ما تترسمش مرتين)
    const backgroundZones = allZones.filter(zone => String(zone.id) !== String(id));

    const initialData = state?.zoneData || fetchedData;

    useEffect(() => {
        // لو فيه داتا جاية من التعديل، حدث الموقع المحلي فوراً[cite: 4]
        if (fetchedData?.lat && fetchedData?.lng) {
            const newLat = parseFloat(fetchedData.lat);
            const newLng = parseFloat(fetchedData.lng);

            setLocation({ lat: newLat, lng: newLng });
        }
    }, [fetchedData]);

    // تحديث موقع الخريطة عند تحميل البيانات[cite: 4]
    useEffect(() => {
        if (initialData?.lat && initialData?.lng) {
            setLocation({
                lat: parseFloat(initialData.lat),
                lng: parseFloat(initialData.lng)
            });
        }
    }, [initialData]);

    if (id && (isFetching || isLoadingCities)) return <LoadingSpinner />; //[cite: 4]

    const fields = [ //[cite: 4]
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
        <AddPage //[cite: 4]
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
                    <p className="text-sm text-gray-500 mb-4">Click on the map or drag the marker to set the zone's exact location.</p>

                    <div className="border rounded-xl p-1 relative">
                        <MapComponent //[cite: 4]
                            form={methods}
                            selectedLocation={location}
                            setLocationState={setLocation}
                            isMapClickEnabled={true}
                            backgroundZones={backgroundZones} // 💡 تمرير المناطق كـ Prop للخريطة
                            handleMapClick={(e) => {
                                const { lat, lng } = e.latlng;
                                setLocation({ lat, lng });

                                // أضف الخيارات دي ضروري { shouldDirty: true, shouldValidate: true }[cite: 4]
                                methods.setValue('lat', String(lat), { shouldDirty: true, shouldValidate: true });
                                methods.setValue('lng', String(lng), { shouldDirty: true, shouldValidate: true });
                            }}
                            onMarkerDragEnd={(e) => {
                                const { lat, lng } = e.target.getLatLng();
                                setLocation({ lat, lng });

                                methods.setValue('lat', String(lat), { shouldDirty: true, shouldValidate: true });
                                methods.setValue('lng', String(lng), { shouldDirty: true, shouldValidate: true });
                            }}
                        />
                    </div>
                </div>
            )}
        </AddPage>
    );
};

export default ZoneAdd;