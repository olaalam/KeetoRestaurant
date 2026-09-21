import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; 

const BundlesAdd = () => {
    const { t } = useTranslation();
    const { id } = useParams(); 
    const { state } = useLocation();

    const { data: foodsData, isLoading: isFoodsLoading } = useQuery({
        queryKey: ['bundle-foods-select'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/pos/bundles/foods');
            return res.data?.data?.data ?? res.data?.data ?? [];
        }
    });

    const { data: branchesData, isLoading: isBranchesLoading } = useQuery({
        queryKey: ['bundle-branches-select'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/pos/bundles/branches');
            return res.data?.data?.data ?? res.data?.data ?? [];
        }
    });
const { data: BundleData, isLoading: isFetching } = useQuery({
        queryKey: ['Bundle', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/pos/bundles/${id}`);
            return data.data?.data ?? data.data;
        },
        enabled: !!id, // تم إزالة شرط !state?.BundleData ليتم استدعاء الـ API دائماً عند التعديل
    });

    // إعطاء الأولوية للبيانات المجلوبة من الـ API
    let initialData = BundleData || state?.BundleData;
    if (initialData) {
        let preparedFoods = [];
        if (initialData.foods && Array.isArray(initialData.foods)) {
            preparedFoods = initialData.foods.map(f => typeof f === 'object' ? String(f.foodId || f.id) : String(f));
        }

        let preparedBranches = [];
        if (initialData.branchIds && Array.isArray(initialData.branchIds)) {
            preparedBranches = initialData.branchIds.map(b => String(b));
        } else if (initialData.branches && Array.isArray(initialData.branches)) {
            preparedBranches = initialData.branches.map(b => typeof b === 'object' ? String(b.id) : String(b));
        }

        initialData = {
            ...initialData,
            selectedFoods: preparedFoods,
            branchIds: preparedBranches
        };
    }

    const BundleFields = [
        { name: 'name', label: t('name') || 'Name', required: true },
        { name: 'nameAr', label: t('nameAr') || 'Name (Ar)', required: true },
        { name: 'nameFr', label: t('nameFr') || 'Name (Fr)', required: true },
        { name: 'image', label: t('image') || 'Image', type: 'file', required: false },
        { name: 'price', label: t('price') || 'Price', type: 'number', required: true },
        {
            name: 'module',
            label: t('module') || 'Modules',
            required: true,
            type: 'multi-select',
            options: [
                { value: 'pos', label: 'POS' },
                { value: 'web', label: 'Web' },
                { value: 'app', label: 'App' }
            ]
        },
        {
            name: 'selectedFoods',
            label: t('foods') || 'Foods',
            required: false,
            type: 'multi-select',
            options: (foodsData || []).map(f => ({
                value: String(f.id),
                label: f.name || f.nameAr || f.title
            }))
        },
        {
            name: 'branchIds',
            label: t('branches') || 'Branches',
            required: false,
            type: 'multi-select',
            options: (branchesData || []).map(b => ({
                value: String(b.id),
                label: b.name || b.nameAr || b.title
            }))
        },
        { name: 'startDate', label: t('startDate') || 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: t('endDate') || 'End Date', type: 'date', required: true },
    ];

    const handleTransformPayload = (data) => {
        const payload = { ...data };
        
        if (payload.selectedFoods && Array.isArray(payload.selectedFoods)) {
            payload.foods = payload.selectedFoods.map(foodId => ({
                foodId: foodId,
                quantity: 1,
                variations: []
            }));
            delete payload.selectedFoods;
        }

        return payload;
    };

    if ((id && isFetching) || isFoodsLoading || isBranchesLoading) {
        return <LoadingSpinner />;
    }

    return (
        <AddPage
            title={id ? "Edit Bundle" : "Add Bundle"} 
            apiUrl="/api/restaurant/pos/bundles" 
            queryKey="bundles"
            fields={BundleFields}
            initialData={initialData} 
            transformPayload={handleTransformPayload}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default BundlesAdd;