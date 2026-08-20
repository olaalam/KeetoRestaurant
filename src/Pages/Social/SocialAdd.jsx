import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";

const SocialAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();
    const { t, language } = useTranslation();

    // جلب قائمة المنصات المتاحة للاختيار
    const { data: platforms = [], isLoading: isPlatformsLoading } = useQuery({
        queryKey: ['social-platforms-select'],
        queryFn: async () => {
            const { data } = await api.get('/api/restaurant/socialmedia/select-platform');
            return data?.data?.data || data?.data || [];
        },
    });

    // جلب بيانات الحساب المحدد في حالة التعديل
    const { data: socialData, isLoading: isFetching, error } = useQuery({
        queryKey: ['social', id],
        queryFn: async () => {
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
            platformId: String(rawData.platformId || rawData.platform?.id || rawData.platform?._id || ''),
            link: rawData.link || '',
            id: rawData.id
        };
    }, [rawData]);

    // تجهيز خيارات قائمة الاختيار مع تحويل الـ value إلى string صريح
    const platformOptions = React.useMemo(() => {
        return platforms.map((item) => {
            const platformValue = item.id || item._id || item.platformId;
            const platformLabel = language === 'ar' 
                ? (item.nameAr || item.displayNameAr || item.name || item.displayName) 
                : (item.name || item.displayName || item.nameAr || item.displayNameAr);

            return {
                value: String(platformValue), // تحويل صريح إلى String ليعمل الـ Select بدون مشاكل
                label: platformLabel || item.title || '',
            };
        });
    }, [platforms, language]);

    const socialFields = [
        { 
            name: 'platformId', 
            label: t('platform') || 'Platform', 
            type: 'select', 
            options: platformOptions, 
            required: true 
        },
        { 
            name: 'link', 
            label: t('link'), 
            type: 'text',
            required: true 
        },
    ];

    if ((id && isFetching) || isPlatformsLoading) return <LoadingSpinner />;

    return (
        <AddPage
            title={id ? t("editSocialMedia") : t("addSocialMedia")}
            apiUrl={id ? `/api/restaurant/socialmedia/${id}` : "/api/restaurant/socialmedia/add"} 
            fields={socialFields}
            initialData={initialData} 
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default SocialAdd;