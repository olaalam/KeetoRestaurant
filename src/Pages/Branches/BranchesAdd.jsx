import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage'; // تأكد من المسار الصحيح
import LoadingSpinner from '@/components/LoadingSpinner';
import MapComponent from '@/components/MapComponent';


const RestaurantAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const isEdit = !!id;

    // 1. جلب بيانات القوائم المنسدلة
    const { data: zones = [], isLoading: isLoadingSelect } = useQuery({
        queryKey: ['branchSelectData'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/branches/zone');
            // الوصول للمصفوفة مباشرة بناءً على الريسبونس: res.data (axios) -> data -> data (array)
            return res.data.data.data || [];
        }
    });

    // 2. جلب بيانات المطعم في حالة التعديل
    const { data: fetchedData, isLoading: isFetching } = useQuery({
        queryKey: ['branch', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/branches/${id}`);
            const raw = data.data.data;
            // تنسيق البيانات لتناسب النموذج
            return {
                ...raw,
                cuisineId: String(raw.cuisineId),
                zoneId: String(raw.zoneId),
                tags: Array.isArray(raw.tags) ? raw.tags.join(', ') : raw.tags,
                // lat: String(raw.lat || ""),
                // lng: String(raw.lng || ""),
            };
        },
        enabled: !!id && !state?.branchData,
    });

    const initialData = state?.branchData || fetchedData;

    // إعدادات الخريطة (منطق منفصل)
    // const [location, setLocation] = useState({ lat: 31.2001, lng: 29.9187 });

    // useEffect(() => {
    //     if (initialData?.lat && initialData?.lng) {
    //         setLocation({
    //             lat: parseFloat(initialData.lat),
    //             lng: parseFloat(initialData.lng)
    //         });
    //     }
    // }, [initialData]);

    if (id && (isFetching || isLoadingSelect)) return <LoadingSpinner />;

    // تعريف الحقول لـ AddPage
    const fields = [
        { name: 'name', label: 'Branch Name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: true },
        { name: 'address', label: 'Address', type: 'text', required: true },
        {
            name: 'zoneId',
            label: 'Zone',
            type: 'select',
            required: true,
            // بما أن zones أصبحت مصفوفة الآن، نقوم بعمل map مباشرة عليها
            options: zones.map(z => ({
                label: z.name, // سيظهر "sidi gaber"
                value: z.id    // سيُرسل الـ "id" للباك
            }))
        },
        // { name: 'address', label: 'Detailed Address', required: true },
    ];

    return (

        <AddPage
            title="Branch"
            apiUrl="/api/restaurant/branches"
            queryKey="branches"
            fields={fields}
            initialData={initialData}
            onSuccessAction={() => navigate(-1)}
        >
            {/* {(methods) => (
                <div className="space-y-4 pt-4 border-t">
                    <div className="border rounded-xl p-1 relative">
                        <MapComponent
                            form={methods} // تمرير الميثودز لتفعيل watch داخل الخريطة
                            selectedLocation={location}
                            isMapClickEnabled={true}
                            handleMapClick={(e) => {
                                const { lat, lng } = e.latlng;
                                setLocation({ lat, lng });
                                methods.setValue('lat', String(lat), { shouldDirty: true });
                                methods.setValue('lng', String(lng), { shouldDirty: true });
                            }}
                            onMarkerDragEnd={(e) => {
                                const { lat, lng } = e.target.getLatLng();
                                setLocation({ lat, lng });
                                methods.setValue('lat', String(lat), { shouldDirty: true });
                                methods.setValue('lng', String(lng), { shouldDirty: true });
                            }}
                        />
                    </div>
                </div>
            )} */}
        </AddPage>
    );
};

export default RestaurantAdd;