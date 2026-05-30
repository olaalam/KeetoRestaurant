import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

const ImageAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();
    const { t } = useTranslation(); // تفعيل الهوك

    // جلب بيانات الصورة المحددة في حالة التعديل
    const { data: imageData, isLoading: isFetching } = useQuery({
        queryKey: ['image', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/image/${id}`);
            return data.data.data; 
        },
        enabled: !!id && !state?.imageData, 
    });

    const rawData = state?.imageData || imageData;

    // تجهيز البيانات الابتدائية للفورم وتنظيفها
    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        const { periorty, ...restOfData } = rawData;

        return {
            ...restOfData,
            periorty: rawData.periorty || periorty 
        };
    }, [rawData]);

    // الحقول المطلوبة للفورم مترجمة بالكامل
    const imageFields = [
        { 
            name: 'img', 
            label: t('imageFile'), 
            type: 'file', 
            required: !initialData 
        },
        { 
            name: 'periorty', 
            label: t('priority'), 
            type: 'number', 
            required: true 
        }
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("restaurantImages")}
            apiUrl="/api/restaurant/image" 
            queryKey="images" 
            fields={imageFields}
            initialData={initialData} 
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default ImageAdd;