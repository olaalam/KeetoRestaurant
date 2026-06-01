import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const ImageAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();

    // جلب بيانات الصورة المحددة في حالة التعديل
    const { data: imageData, isLoading: isFetching } = useQuery({
        queryKey: ['image', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/image/${id}`);
            // بناءً على الـ Response اللي أرسلتيه: data.data.data يحمل كائن الصورة
            return data.data.data; 
        },
        enabled: !!id && !state?.imageData, 
    });

    const rawData = state?.imageData || imageData;

    // تجهيز البيانات الابتدائية للفورم وتنظيفها
    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        // هنا بنعمل Destructuring عشان نخرج periorty بره خالص ونمسحها
        const { periorty, ...restOfData } = rawData;

        return {
            ...restOfData,
            // نضع القيمة داخل الاسم الصحيح 'priority'
            periorty: rawData.periorty || periorty 
        };
    }, [rawData]);

    // الحقول المطلوبة للفورم
    const imageFields = [
        { 
            name: 'img', 
            label: 'Image', 
            type: 'file', 
            required: !initialData // مش إجباري في التعديل
        },
        { 
            name: 'periorty', 
            label: 'Priority', 
            type: 'number', 
            required: true 
        }
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="image"
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