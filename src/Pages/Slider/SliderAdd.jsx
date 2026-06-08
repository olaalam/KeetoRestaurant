import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

const SliderAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();
    const { t } = useTranslation(); // تفعيل الهوك

    // جلب بيانات الصورة المحددة في حالة التعديل
    const { data: sliderData, isLoading: isFetching } = useQuery({
        queryKey: ['slider', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/slider/${id}`);
            return data.data.data; 
        },
        enabled: !!id && !state?.sliderData, 
    });

    const rawData = state?.sliderData || sliderData;

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
    const sliderFields = [
        { 
            name: 'img', 
            label: t('sliderFile'), 
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
            title={t("restaurantSlider")}
            apiUrl="/api/restaurant/slider" 
            queryKey="sliders" 
            fields={sliderFields}
            initialData={initialData} 
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default SliderAdd;