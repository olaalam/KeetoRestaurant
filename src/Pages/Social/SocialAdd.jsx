import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const SocialAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();

    // جلب بيانات الصورة المحددة في حالة التعديل
    const { data: socialData, isLoading: isFetching, error } = useQuery({
        queryKey: ['social', id],
        queryFn: async () => {
            console.log("Fetching data for ID:", id); // مراقبة الطلب
            const { data } = await api.get(`/api/restaurant/socialmedia/${id}`);
            
            console.log("Raw API Response:", data); // طباعة الـ Response القادم من الـ API

            // الحل الأكيد للمصفوفة: نأخذ العنصر الأول فوراً إذا كان القادم Array
            if (data?.data?.data && Array.isArray(data.data.data)) {
                return data.data.data[0]; 
            }
            return data?.data?.data; 
        },
        enabled: !!id && !state?.socialData, 
    });

    if (error) {
        console.error("Error fetching social data:", error);
    }

    const rawData = state?.socialData || socialData;
    console.log("Data going into Form (rawData):", rawData); // مراقبة البيانات قبل دخولها للفورم

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            link: rawData.link || '',
            icon: rawData.icon || '', 
            id: rawData.id
        };
    }, [rawData]);

    const socialFields = [
        { name: 'link', label: 'Link', required: true },
        { name: 'icon', label: 'Icon', type: 'file', required: !id }, 
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="Add Social Media"
            apiUrl={id ? `/api/restaurant/socialmedia/` : "/api/restaurant/socialmedia/add"} 
            fields={socialFields}
            initialData={initialData} 
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default SocialAdd;