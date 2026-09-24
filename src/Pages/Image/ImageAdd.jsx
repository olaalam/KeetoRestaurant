import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";

const ImageAdd = () => {
    const { id } = useParams(); 
    const { state } = useLocation();
    const { t } = useTranslation();

    // 1. جلب قائمة الفروع لاختيار الفرع (branchId)
    const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const { data } = await api.get('/api/restaurant/branch');
            return data?.data?.data || data?.data || [];
        }
    });

    // 2. جلب بيانات الصورة في حالة التعديل
    const { data: imageData, isLoading: isFetching } = useQuery({
        queryKey: ['image', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/image/select-branch/${id}`);
            return data?.data?.data || data?.data; 
        },
        enabled: !!id && !state?.imageData, 
    });

    const rawData = state?.imageData || imageData;

    // تجهيز البيانات الابتدائية للفورم
    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            img: rawData.img || "",
            periorty: rawData.periorty || 1,
            branchId: rawData.branchId || rawData.branch?.id || ""
        };
    }, [rawData]);

    // تحويل الفروع إلى خيارات للقائمة المنسدلة
    const branchOptions = branches.map((branch) => ({
        label: branch.name || branch.branchName || branch.id,
        value: branch.id
    }));

    // الحقول المطلوبة مطابق لـ Body المطلوب: { img, periorty, branchId }
    const imageFields = [
        { 
            name: 'img', 
            label: t('imageFile') || 'الصورة', 
            type: 'file', 
            required: !initialData 
        },
        { 
            name: 'periorty', 
            label: t('priority') || 'الأولوية', 
            type: 'number', 
            required: true 
        },
        {
            name: 'branchId',
            label: t('branch') || 'الفرع',
            type: 'select',
            options: branchOptions,
            required: true
        }
    ];

    if ((id && isFetching) || isLoadingBranches) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("restaurantImages") || "صور المطعم"}
            apiUrl="/api/restaurant/image/select-branch" 
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