import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

const SettingAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل هوك الترجمة

    const { data: fullData, isLoading: isFetching } = useQuery({
        queryKey: ['setting', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/restaurantsetting`);
            return data.data;
        },
        enabled: !!id && !state?.settingData,
    });

    const rawData = state?.settingData || fullData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        const { id, ...settingsWithoutId } = rawData.settings || {};

        return {
            ...settingsWithoutId, 
            schedules: rawData.schedules
        };
    }, [rawData]);

    // ترجمة الـ labels الخاصة بالحقول تلقائياً
    const settingFields = [
        { name: "foodManagement", label: t("foodManagement"), type: "switch" },
        { name: "scheduledDelivery", label: t("scheduledDelivery"), type: "switch" },
        { name: "reviewsSection", label: t("reviewsSection"), type: "switch" },
        { name: "posSection", label: t("posSection"), type: "switch" },
        { name: "selfDelivery", label: t("selfDelivery"), type: "switch" },
        { name: "homeDelivery", label: t("homeDelivery"), type: "switch" },
        { name: "takeaway", label: t("takeaway"), type: "switch" },
        { name: "orderSubscription", label: t("orderSubscription"), type: "switch" },
        { name: "instantOrder", label: t("instantOrder"), type: "switch" },
        { name: "halalTagStatus", label: t("halal"), type: "switch" },
        { name: "dineIn", label: t("dineIn"), type: "switch" },
        
        // الحقول الرقمية
        { name: "minOrderAmount", label: t("minOrderAmount"), type: "number" },
        { name: "minDeliveryTime", label: t("minDeliveryTime"), type: "number" },
        { name: "maxDeliveryTime", label: t("maxDeliveryTime"), type: "number" },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("restaurantSettings")} // ترجمة عنوان الصفحة
            apiUrl={`/api/restaurant/restaurantsetting`}
            method="PUT"
            queryKey="setting"
            fields={settingFields}
            initialData={initialData}
            onSuccessAction={() => {
                console.log("Updated Successfully");
                navigate(`/branches/setting/${id}`);
            }}
        />
    );
};

export default SettingAdd;