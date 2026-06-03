import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

const SocialAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();
    const { t } = useTranslation(); // تفعيل الهوك

    // جلب بيانات الحساب المحدد في حالة التعديل
    const { data: socialData, isLoading: isFetching, error } = useQuery({
        queryKey: ['social', id],
        queryFn: async () => {
            console.log("Fetching data for ID:", id);
            const { data } = await api.get(`/api/restaurant/socialmedia/${id}`);
            
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

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            link: rawData.link || '',
            icon: rawData.icon || '', 
            id: rawData.id
        };
    }, [rawData]);

    const socialFields = [
        { name: 'link', label: t('link'), required: true },
        { name: 'icon', label: t('icon'), type: 'file', required: !id }, 
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={id ? t("editSocialMedia") : t("addSocialMedia")} // تخصيص العنوان حسب حالة التعديل/الإضافة
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