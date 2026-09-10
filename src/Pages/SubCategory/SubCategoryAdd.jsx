import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// دالة تحويل الصورة إلى Base64
const toBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

const SubCategoryAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const { t } = useTranslation();
    
    // حالة لحفظ الصورة وتحميل العرض المسبق
    const [imagePreview, setImagePreview] = useState(null);
    const [base64Image, setBase64Image] = useState(null);

    const { data: lookups, isLoading: isSelectLoading } = useQuery({
        queryKey: ["food-select-options"],
        queryFn: async () => {
            const response = await api.get("/api/restaurant/food/select");
            return response.data?.data?.data || {};
        },
    });
    const categories = lookups?.categories || [];
    const addons = lookups?.addons || [];

    const { data: subcategoryData, isLoading: isFetching } = useQuery({
        queryKey: ['subcategory', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/subcategories/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.subcategoryData,
    });

    const rawData = state?.subcategoryData || subcategoryData;

    React.useEffect(() => {
        if (rawData?.image) {
            setImagePreview(rawData.image);
        }
    }, [rawData]);

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        let parsedAddonsIds = [];
        if (rawData.addonsIds) {
            if (Array.isArray(rawData.addonsIds)) {
                parsedAddonsIds = rawData.addonsIds;
            } else if (typeof rawData.addonsIds === 'string') {
                try {
                    parsedAddonsIds = JSON.parse(rawData.addonsIds);
                } catch (e) {
                    console.error("Error parsing addonsIds:", e);
                    parsedAddonsIds = [];
                }
            }
        }

        return {
            ...rawData,
            categoryId: rawData.categoryId || rawData.category?.id,
            order_level: rawData.order_level ? Number(rawData.order_level) : 0,
            addonsIds: parsedAddonsIds.map(id => String(id))
        };
    }, [rawData]);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base = await toBase64(file);
                setBase64Image(base);
                setImagePreview(base);
            } catch (error) {
                console.error("Error converting image:", error);
            }
        }
    };

    // إزالة حقل الصورة من هنا تماماً
    const subcategoryFields = [
        { name: 'name', label: t('name'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        {
            name: 'categoryId',
            label: t('category'),
            required: true,
            type: 'combobox',
            options: categories.map(c => ({ value: c.id, label: c.name }))
        },
        {
            name: 'addonsIds',
            label: t('addons'),
            required: false,
            type: 'multi-select',
            options: addons.map(a => ({ value: a.id, label: a.name }))
        },
        { name: 'order_level', label: t('orderLevel'), required: true, type: 'number' },
        {
            name: 'priority',
            label: t('priority'),
            required: true,
            type: 'select',
            options: [
                { value: 'low', label: t('low') },
                { value: 'medium', label: t('medium') },
                { value: 'high', label: t('high') },
            ]
        }
    ];

    const transformPayload = (formData) => {
        return {
            ...formData,
            // سيتم إرفاق الـ base64Image مع البيانات المرسلة
            image: base64Image ? base64Image : undefined, 
        };
    };

    if (isSelectLoading || (id && isFetching)) return <LoadingSpinner />;

    return (
        <AddPage
            title={t('subcategoryTitle')}
            apiUrl="/api/restaurant/subcategories"
            queryKey={["subcategories"]}
            fields={subcategoryFields}
            initialData={initialData}
            transformPayload={transformPayload}
            onSuccessAction={() => {
                window.history.back();
            }}
        >
            {/* تم نقل حقل الصورة هنا كـ Children لكي يعرضه الـ AddPage بشكل صحيح */}
            <div className="space-y-2 col-span-full mb-4 md:col-span-1 lg:col-span-2">
                <Label>{t("image") || "الصورة"}</Label>
                <div className="flex items-center gap-4">
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                    />
                    {imagePreview && (
                        <div className="w-16 h-16 border rounded overflow-hidden shrink-0 shadow-sm">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </div>
        </AddPage>
    );
};

export default SubCategoryAdd;