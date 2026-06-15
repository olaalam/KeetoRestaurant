import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import MapComponent from '@/components/MapComponent';
import { useTranslation } from "@/hooks/useTranslation";
import { MapPin } from "lucide-react";

const RestaurantAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isEdit = !!id;
    
    const [selectedCityId, setSelectedCityId] = useState('');
    // تعريف الـ State الخاص بالموقع الجغرافي لتفادي أخطاء عدم التعريف
    const [location, setLocation] = useState({ lat: 30.0444, lng: 31.2357 }); // قيم افتراضية (مثال: القاهرة)

    // جلب قائمة المدن والمناطق من الـ API
    const { data: selectionData = { zones: [], cities: [] }, isLoading: isLoadingZones } = useQuery({
        queryKey: ['DeliveryZonesSelect'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurant-zone-delivery-fees/select');
            const responseData = res.data?.data?.data || {};
            return {
                zones: responseData.zonesselect || [],
                cities: responseData.citiesselect || []
            };
        }
    });

    const { data: zones = [], isLoading: isLoadingSelect } = useQuery({
        queryKey: ['branchSelectData'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/branches/zone');
            return res.data.data.data || [];
        }
    });

    const { data: fetchedData, isLoading: isFetching } = useQuery({
        queryKey: ['branch', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/branches/${id}`);
            const raw = data.data.data;
            return {
                ...raw,
                cuisineId: String(raw.cuisineId),
                zoneId: String(raw.zoneId),
                tags: Array.isArray(raw.tags) ? raw.tags.join(', ') : raw.tags,
            };
        },
        enabled: !!id && !state?.branchData,
    });

    const rawData = state?.zoneDeliveryData || fetchedData;

    // تحويل البيانات (Mapping) واستخراج cityId في حالة التعديل
    const initialData = useMemo(() => {
        if (!rawData) return null;

        const zoneId = rawData.zone?.id || rawData.zoneId;
        const zone = selectionData.zones.find(z => String(z.id) === String(zoneId));
        const cityId = zone?.cityId || rawData.cityId || '';

        return {
            ...rawData,
            cityId: String(cityId), 
            zoneId: String(zoneId),
            deliveryFee: rawData.deliveryFee,
            deliveryRadiusKm: rawData.deliveryRadiusKm,
            lat: String(rawData.lat || ""), 
            lng: String(rawData.lng || ""), 
        };
    }, [rawData, selectionData.zones]);

    // تعيين المدينة كقيمة افتراضية عند تحميل بيانات التعديل
    useEffect(() => {
        if (initialData?.cityId && !selectedCityId) {
            setSelectedCityId(initialData.cityId);
        }
    }, [initialData, selectedCityId]);

    // تصفية المناطق بناءً على المدينة المختارة
    const filteredZones = useMemo(() => {
        if (!selectedCityId) return [];
        return selectionData.zones.filter(z =>
            String(z.cityId) === String(selectedCityId)
        );
    }, [selectedCityId, selectionData.zones]);

    // تحديث موقع الخريطة عند تحميل البيانات
    useEffect(() => {
        if (fetchedData?.lat && fetchedData?.lng) {
            setLocation({ 
                lat: parseFloat(fetchedData.lat), 
                lng: parseFloat(fetchedData.lng) 
            });
        }
    }, [fetchedData]);

    useEffect(() => {
        if (initialData?.lat && initialData?.lng) {
            setLocation({
                lat: parseFloat(initialData.lat),
                lng: parseFloat(initialData.lng)
            });
        }
    }, [initialData]);

    if (id && (isFetching || isLoadingSelect || isLoadingZones)) return <LoadingSpinner />;

    // بناء مصفوفة الحقول وتمرير الـ methods للتحكم بها عند الحاجة
    const getFields = (methods) => [
        { name: 'name', label: t('branchName'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        { name: 'phoneNumber', label: t('phoneNumberLabel'), type: 'text', required: true },
        { name: 'deliveryRadiusKm', label: t('deliveryRadiusKm'), type: 'number', required: true },
        { name: 'address', label: t('addressLabel'), type: 'text', required: true },
        {
            name: 'cityId',
            label: t('city'),
            required: true,
            type: 'select',
            options: selectionData.cities.map(c => ({
                value: String(c.id),
                label: c.name
            })),
            onChange: (e) => {
                const value = e?.target?.value !== undefined ? e.target.value : e;
                setSelectedCityId(value);
                
                // تصفير قيمة المنطقة في الفورم عند تغيير المدينة لضمان عدم إرسال داتا متضاربة
                if (methods) {
                    methods.setValue('zoneId', '', { shouldDirty: true, shouldValidate: true });
                }
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
            disabled: !selectedCityId
        },
        // 🟢 إضافة حقول الـ lat و lng هنا لتظهر داخل الفورم وتُرسل للـ API
        {
            name: 'lat',
            label: t('latitude') || 'Latitude',
            required: true,
            type: 'text',
            disabled: true // معطلة حتى لا يقوم المستخدم بتعديلها يدوياً بل عبر الخريطة فقط
        },
        {
            name: 'lng',
            label: t('longitude') || 'Longitude',
            required: true,
            type: 'text',
            disabled: true // معطلة حتى لا يقوم المستخدم بتعديلها يدوياً بل عبر الخريطة فقط
        },
    ];

    return (
        <AddPage
            title={t('branchTitle')}
            apiUrl="/api/restaurant/branches"
            queryKey="branches"
            fields={getFields()} 
            initialData={initialData}
            onSuccessAction={() => navigate(-1)}
        >
            {(methods) => {
                return (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <MapPin className="text-primary w-5 h-5" />
                            <h3 className="text-lg font-semibold">Zone Location</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Click on the map or drag the marker to set the zone's exact location.</p>

                        <div className="border rounded-xl p-1 relative">
                            <MapComponent
                                form={methods}
                                selectedLocation={location}
                                isMapClickEnabled={true}
                                handleMapClick={(e) => {
                                    const { lat, lng } = e.latlng;
                                    setLocation({ lat, lng });

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
                );
            }}
        </AddPage>
    );
};

export default RestaurantAdd;